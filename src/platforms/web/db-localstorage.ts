import { PubSub } from '../../core/utils/pubsub'
import {
  PlatformDatabaseInterface,
  Settings,
  TypedConcept,
} from '../../core/interfaces'
import env from '../../env'
import { getDefaultSettings } from '../../core/utils/settings'

const CHANNEL_ANY_CHANGES = '*'
const pubSub = new PubSub()

/**
 * Database implemented with localStorage.
 *
 * TODO: Add frontend LRU cache, update on write.
 * TODO: Add write buffer that queue writes and use transaction to write
 *       a batch.
 */
function markStorageUpdate() {
  localStorage.setItem('lastUpdatedAt', Date.now().toString())
}

export const database: PlatformDatabaseInterface = {
  isValid: () => {
    return new Promise(resolve => {
      resolve(localStorage.getItem('JADE_DB_LOADED') !== null)
    })
  },
  init: (settings, concepts) => {
    return new Promise(resolve => {
      database.saveSettings(settings)
      concepts.forEach(concept => {
        database.createConcept(concept)
      })
      localStorage.setItem('JADE_DB_LOADED', '')
      localStorage.setItem('JADE_DB_VER', env.JADE_DB_VER.toString())
      resolve()
    })
  },
  getConcept: id => {
    return new Promise(resolve => {
      try {
        const item = localStorage.getItem(`concept/${id}`)
        if (!item) {
          resolve(undefined)
          return // to supress type error on JSON.parse(item)
        }
        const concept = JSON.parse(item) as TypedConcept<unknown>
        resolve(concept.relations ? concept : { ...concept, relations: [] })
      } catch (error) {
        resolve(undefined)
      }
    })
  },
  getAllConcepts: () => {
    return new Promise(resolve => {
      const concepts = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('concept')) {
          const json = localStorage.getItem(key)
          if (!json) continue
          const concept = JSON.parse(json) as TypedConcept<unknown>
          concepts.push(
            concept.relations ? concept : { ...concept, relations: [] }
          )
        }
      }
      resolve(concepts)
    })
  },
  updateConcept: concept => {
    setTimeout(() => {
      localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
      markStorageUpdate()
      pubSub.publish(concept.id, concept)
      pubSub.publish(CHANNEL_ANY_CHANGES, concept)
    }, 0)
  },
  createConcept: concept => {
    localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
    markStorageUpdate()
    pubSub.publish(concept.id, concept)
    pubSub.publish(CHANNEL_ANY_CHANGES, concept)
  },
  getSettings: () => {
    try {
      const json = localStorage.getItem('settings')
      if (!json) {
        throw new Error('Settings is null')
      }
      const settings = JSON.parse(json) as Settings
      return settings
    } catch (error) {
      console.error(error)
      const defaultSettings = getDefaultSettings()
      database.saveSettings(defaultSettings)
      return defaultSettings
    }
  },
  saveSettings: settings => {
    localStorage.setItem('settings', JSON.stringify(settings))
    markStorageUpdate()
  },
  getLastUpdatedTime: () => {
    const lastUpdatedAt = localStorage.getItem('lastUpdatedAt')
    return lastUpdatedAt ? parseInt(lastUpdatedAt) : 0
  },
  getVersion: () => {
    return new Promise(resolve => {
      const dbVer = localStorage.getItem('JADE_DB_VER')
      resolve(dbVer ? parseInt(dbVer) : 0)
    })
  },
  setVersion: n => {
    localStorage.setItem('JADE_DB_VER', n.toString())
  },
  subscribeConcept: pubSub.subscribe,
  unsubscribeConcept: pubSub.unsubscribe,
}
