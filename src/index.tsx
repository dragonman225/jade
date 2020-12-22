/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './App'
import { State3 } from './core/interfaces'
import { loadState, database } from './lib/storage'

const initialState = require('./InitialState.json') as State3

/** Migrate old state_v3 to the new database. */
const state = loadState() || initialState
database.saveSettings({
  debugging: state.debugging,
  homeConceptId: state.homeConceptId,
  viewingConceptId: state.viewingConceptId
})
Object.values(state.conceptMap).forEach(concept => {
  database.saveConcept(concept)
})

ReactDOM.render(<App db={database} />, document.getElementById('react-root'))