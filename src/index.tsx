/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './App'
import { Database, Settings, State3 } from './core/interfaces'
import { Concept } from './core/interfaces/concept'
import { loadState } from './lib/storage'

const initialState = require('./InitialState.json') as State3

function markStorageUpdate() {
  localStorage.setItem('lastUpdatedAt', Date.now().toString())
}

const db: Database = {
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

/** Migration. */
const state = loadState() || initialState
db.saveSettings({
  debugging: state.debugging,
  homeConceptId: state.homeConceptId,
  viewingConceptId: state.viewingConceptId
})
Object.values(state.conceptMap).forEach(concept => {
  db.saveConcept(concept)
})

ReactDOM.render(<App db={db} />, document.getElementById('react-root'))
