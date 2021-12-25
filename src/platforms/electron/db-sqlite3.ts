import ActualSQLiteDatabase from 'better-sqlite3'

import {
  PlatformDatabaseInterface,
  Settings,
  TypedConcept,
} from '../../core/interfaces'
import { PubSub } from '../../core/utils/pubsub'
import env from '../../env'

interface SQLiteDatabase {
  prepare(sql: string): SQLiteStatement
  transaction(fn: (...args: unknown[]) => void): (...args: unknown[]) => void
  transaction<T>(fn: (arg: T) => void): (arg: T) => void
  pragma(name: string, options?: { simple: boolean }): unknown
  pragma<T>(name: string, options?: { simple: boolean }): T
  inTransaction: boolean
}

interface SQLiteDatabaseConstructor {
  new (
    path: string,
    options?: {
      verbose: (...args: unknown[]) => void
    }
  ): SQLiteDatabase
}

interface SQLiteStatement {
  run(
    ...bindParameters: unknown[]
  ): {
    changes: number
    lastInsertRowid: number
  }
  get(...bindParameters: unknown[]): unknown
  get<T>(...bindParameters: unknown[]): T
  all(...bindParameters: unknown[]): unknown[]
  all<T>(...bindParameters: unknown[]): T[]
}

interface DryConcept {
  id: string
  json: string
}

interface DrySetting {
  key: string
  value: string
}

interface WriteBufferItem {
  table: string
  id: string
  type: 'update' | 'create'
  data: string
}

const SQLiteDatabase = ActualSQLiteDatabase as SQLiteDatabaseConstructor

function log(...args: unknown[]) {
  console.log('electron-storage:', ...args)
}

function createDatabase(path: string): PlatformDatabaseInterface {
  const db = new SQLiteDatabase(path)
  const conceptsTableName = 'concepts'
  const settingsTableName = 'settings'
  let writeBuffer: WriteBufferItem[] = []
  const minUpdateInterval = 500
  const conceptCache = new Map<string, TypedConcept<unknown>>()
  let settingsCache: Settings
  let lastUpdatedTime = Date.now()
  let timer: NodeJS.Timeout | undefined = undefined
  const CHANNEL_ANY_CHANGES = '*'
  const pubSub = new PubSub()

  const createConceptsTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS ${conceptsTableName} (
      concept_id text PRIMARY KEY,
      json text NOT NULL
    );`)
  const createSettingsTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS ${settingsTableName} (
      key text PRIMARY KEY,
      value text NOT NULL
    );`)
  db.transaction(() => {
    createConceptsTable.run()
    createSettingsTable.run()
  })()

  /**
   * Enhance performance.
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/benchmark.md
   */
  db.pragma('cache_size = -16000')
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  const conceptStmt = {
    select: db.prepare(`
      SELECT * FROM ${conceptsTableName}
      WHERE concept_id = @id`),
    selectAll: db.prepare(`
      SELECT * FROM ${conceptsTableName}`),
    update: db.prepare(`
      UPDATE ${conceptsTableName}
      SET json = @json
      WHERE concept_id = @id`),
    create: db.prepare(`
      INSERT INTO ${conceptsTableName} (concept_id, json)
      VALUES (@id, @json)`),
  }

  const selectSetting = db.prepare(`
    SELECT * FROM ${settingsTableName}
    WHERE key = @key`)
  const updateSetting = db.prepare(`
    UPDATE ${settingsTableName}
    SET value = @value
    WHERE key = @key`)
  const insertSetting = db.prepare(`
    INSERT INTO ${settingsTableName} (key, value)
    VALUES (@key, @value)`)

  function isValid() {
    try {
      const row = selectSetting.get({ key: 'JADE_DB_LOADED' })
      return !!row
    } catch (error) {
      log(error)
      return false
    }
  }

  function init(settings: Settings, concepts: TypedConcept<unknown>[]) {
    log('Init')
    db.transaction(() => {
      settingsCache = settings
      insertSetting.run({ key: 'settings', value: JSON.stringify(settings) })
      insertSetting.run({ key: 'JADE_DB_LOADED', value: 'yes' })
      insertSetting.run({
        key: 'JADE_DB_VER',
        value: env.JADE_DB_VER.toString(),
      })
      for (let i = 0; i < concepts.length; ++i) {
        const c = concepts[i]
        conceptCache.set(c.id, c)
        conceptStmt.create.run({ id: c.id, json: JSON.stringify(c) })
      }
    })() // Transaction must be called!
    lastUpdatedTime = Date.now()
  }

  function commitBuffer() {
    const start = Date.now()
    const trx = db.transaction<WriteBufferItem[]>(items => {
      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          switch (item.table) {
            case conceptsTableName: {
              const stmt = conceptStmt[item.type]
              if (stmt) {
                stmt.run({ id: item.id, json: item.data })
              } else {
                console.error(`No statement for type "${item.type}".`)
              }
              break
            }
            case settingsTableName: {
              updateSetting.run({ key: item.id, value: item.data })
              break
            }
            default: {
              log('Unknown data type:', item)
            }
          }
        }
      } catch (error) {
        if (!db.inTransaction) throw error
      }
    })
    try {
      trx(writeBuffer)
      writeBuffer = []
      const end = Date.now()
      log(`Commit buffer in ${end - start}ms`)
    } catch (error) {
      log('Commit buffer failed:', error)
    }
  }

  function queueWriteItem(item: WriteBufferItem) {
    log('Queue write', item)
    writeBuffer.push(item)
    if (Date.now() - lastUpdatedTime > minUpdateInterval) {
      commitBuffer()
      lastUpdatedTime = Date.now()
    } else {
      if (!timer) {
        /** Schedule a commit in the future. */
        timer = setTimeout(() => {
          commitBuffer()
          lastUpdatedTime = Date.now()
          timer = undefined
        }, minUpdateInterval)
      }
    }
  }

  function hydrateConcept(dryConcept: DryConcept): TypedConcept<unknown> {
    try {
      const concept = JSON.parse(dryConcept.json) as TypedConcept<unknown>
      return concept.relations ? concept : { ...concept, relations: [] }
    } catch (error) {
      log(error)
      return undefined
    }
  }

  function getConcept(id: string): TypedConcept<unknown> {
    if (conceptCache.has(id)) return conceptCache.get(id)
    try {
      const start = performance.now()
      const stmt = conceptStmt.select
      const dryConcept = stmt.get<DryConcept>({ id })
      const mid = performance.now()
      const concept = hydrateConcept(dryConcept)
      conceptCache.set(id, concept)
      const end = performance.now()
      log(`Select concept "${id}" in ${mid - start}ms, \
parse JSON in ${end - mid}ms.`)
      return concept
    } catch (error) {
      log(error)
      return undefined
    }
  }

  function getAllConcepts(): TypedConcept<unknown>[] {
    const start = performance.now()
    try {
      const stmt = conceptStmt.selectAll
      const dryConcepts = stmt.all<DryConcept>()
      const end = performance.now()
      log(`Select all concepts in ${end - start} ms`)
      return dryConcepts.map(c => hydrateConcept(c))
    } catch (error) {
      log(error)
      return undefined
    }
  }

  function saveConcept(
    concept: TypedConcept<unknown>,
    type: 'update' | 'create'
  ) {
    conceptCache.set(concept.id, concept)
    const data = JSON.stringify(concept)
    queueWriteItem({
      table: conceptsTableName,
      id: concept.id,
      type,
      data,
    })
    setTimeout(() => {
      pubSub.publish(concept.id)
      pubSub.publish(CHANNEL_ANY_CHANGES)
    })
  }

  function getSettings(): Settings {
    if (settingsCache) return settingsCache
    try {
      const stmt = selectSetting
      const drySetting = stmt.get<DrySetting>({ key: 'settings' })
      return JSON.parse(drySetting.value) as Settings
    } catch (error) {
      log(error)
      return undefined
    }
  }

  function saveSettings(settings: Settings) {
    settingsCache = settings
    queueWriteItem({
      table: settingsTableName,
      id: 'settings',
      type: 'update',
      data: JSON.stringify(settings),
    })
  }

  function getLastUpdatedTime(): number {
    return lastUpdatedTime
  }

  function getVersion(): number {
    const row = selectSetting.get<{ key: string; value: string }>({
      key: 'JADE_DB_VER',
    })
    const ver = parseInt(row?.value)
    return ver
  }

  function setVersion(n: number): void {
    db.transaction(() => {
      insertSetting.run({ key: 'JADE_DB_VER', value: n.toString() })
    })()
  }

  return {
    isValid,
    init,
    getConcept,
    getAllConcepts,
    createConcept: concept => {
      saveConcept(concept, 'create')
    },
    updateConcept: concept => {
      saveConcept(concept, 'update')
    },
    getSettings,
    saveSettings,
    getLastUpdatedTime,
    getVersion,
    setVersion,
    subscribeConcept: pubSub.subscribe,
    unsubscribeConcept: pubSub.unsubscribe,
  }
}

export const database = createDatabase('jade.db')
