import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './App'
import { legacyLoadState } from '../resources/web-legacy-storage'
import { DatabaseInterface } from './interfaces'

/** Render the app with platform-specific resources. */
export function renderApp(database: DatabaseInterface): void {
  /** Migrate old state_v3 to the new database. */
  const state3 = legacyLoadState()
  if (!database.isValid() && state3) {
    console.log('Migrating state_v3 to new format.')
    database.init({
      debugging: state3.debugging,
      homeConceptId: state3.homeConceptId,
      viewingConceptId: state3.viewingConceptId
    }, Object.values(state3.conceptMap))
  }

  ReactDOM.render(
    React.createElement(App, { db: database }),
    document.getElementById('react-root')
  )
}