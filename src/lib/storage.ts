import { Database, Settings, State3 } from '../core/interfaces'
import { Concept } from '../core/interfaces/concept'

/** Legacy database interface. */
const itemKey = 'state_v3'

export function loadState(): State3 | undefined {
  const blob = localStorage.getItem(itemKey)
  if (blob) {
    try {
      const state = JSON.parse(blob) as State3
      return state
    } catch (err) {
      return undefined
    }
  } else {
    return undefined
  }
}

export function saveState(state: State3): void {
  localStorage.setItem(itemKey, JSON.stringify(state))
}

/** 
 * New database interface.
 * TODO: Add frontend LRU cache, invalidate on write.
 */
function markStorageUpdate() {
  localStorage.setItem('lastUpdatedAt', Date.now().toString())
}

export const database: Database = {
  getConcept: (id) => {
    try {
      const concept = JSON.parse(localStorage.getItem(`concept/${id}`)) as Concept
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
  saveConcept: (concept) => {
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
  saveSettings: (settings) => {
    localStorage.setItem('settings', JSON.stringify(settings))
    markStorageUpdate()
  },
  getLastUpdatedTime: () => {
    return parseInt(localStorage.getItem('lastUpdatedAt'))
  }
}