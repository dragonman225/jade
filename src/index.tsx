import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './core/App'
import { legacyLoadState, database } from './lib/storage'

/** Migrate old state_v3 to the new database. */
const state3 = legacyLoadState()
if (!database.isValid() && state3) {
  database.init({
    debugging: state3.debugging,
    homeConceptId: state3.homeConceptId,
    viewingConceptId: state3.viewingConceptId
  }, Object.values(state3.conceptMap))
}

ReactDOM.render(<App db={database} />, document.getElementById('react-root'))