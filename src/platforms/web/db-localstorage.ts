import { PubSub } from '../../core/utils/pubsub'
import {
  DatabaseInterface,
  Settings,
  TypedConcept,
} from '../../core/interfaces'
import env from '../../env'

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

export const database: DatabaseInterface = {
  isValid: () => {
    return localStorage.getItem('JADE_DB_LOADED') !== null
  },
  init: (settings, concepts) => {
    database.saveSettings(settings)
    concepts.forEach(concept => {
      database.createConcept(concept)
    })
    localStorage.setItem('JADE_DB_LOADED', '')
    localStorage.setItem('JADE_DB_VER', env.JADE_DB_VER.toString())
  },
  getConcept: id => {
    try {
      const item = localStorage.getItem(`concept/${id}`)
      const concept = JSON.parse(item) as TypedConcept<unknown>
      return concept.relations ? concept : { ...concept, relations: [] }
    } catch (error) {
      return undefined
    }
  },
  getAllConcepts: () => {
    const concepts = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('concept')) {
        const concept = JSON.parse(
          localStorage.getItem(key)
        ) as TypedConcept<unknown>
        concepts.push(
          concept.relations ? concept : { ...concept, relations: [] }
        )
      }
    }
    return concepts
  },
  updateConcept: concept => {
    setTimeout(() => {
      localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
      markStorageUpdate()
      setTimeout(() => {
        pubSub.publish(concept.id)
        pubSub.publish(CHANNEL_ANY_CHANGES)
      })
    }, 0)
  },
  createConcept: concept => {
    localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
    markStorageUpdate()
    pubSub.publish(concept.id)
    pubSub.publish(CHANNEL_ANY_CHANGES)
  },
  getSettings: () => {
    try {
      const settings = JSON.parse(localStorage.getItem('settings')) as Settings
      return settings
    } catch (error) {
      return undefined
    }
  },
  saveSettings: settings => {
    localStorage.setItem('settings', JSON.stringify(settings))
    markStorageUpdate()
  },
  getLastUpdatedTime: () => {
    return parseInt(localStorage.getItem('lastUpdatedAt'))
  },
  getVersion: () => {
    return parseInt(localStorage.getItem('JADE_DB_VER'))
  },
  setVersion: n => {
    localStorage.setItem('JADE_DB_VER', n.toString())
  },
  subscribeConcept: pubSub.subscribe,
  unsubscribeConcept: pubSub.unsubscribe,
}
