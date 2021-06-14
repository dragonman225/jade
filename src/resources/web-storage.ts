import { DatabaseInterface, Settings, Concept } from '../core/interfaces'
import env from '../env'

/**
 * New database interface.
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
      const concept = JSON.parse(item) as Concept
      return concept
    } catch (error) {
      return undefined
    }
  },
  getAllConcepts: () => {
    const concepts = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('concept')) {
        const concept = JSON.parse(localStorage.getItem(key)) as Concept
        concepts.push(concept)
      }
    }
    return concepts
  },
  updateConcept: concept => {
    localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
    markStorageUpdate()
  },
  createConcept: concept => {
    localStorage.setItem(`concept/${concept.id}`, JSON.stringify(concept))
    markStorageUpdate()
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
}
