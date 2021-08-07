import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { App } from './App'
import { isNaN } from './utils'
import { factoryRegistry } from '../factories'
import { legacyLoadState } from '../resources/web-legacy-storage'
import { toolConcepts, toolMaskConcept } from '../resources/initial-concepts'
import env from '../env'
import { Concept4, DatabaseInterface, PositionType } from './interfaces'

/** Render the app with platform-specific resources. */
export function startApp(database: DatabaseInterface): void {
  /** Set title. */
  document.title = `Jade v${env.JADE_VER}`

  /** Migrate old state_v3 to the new database. */
  const state3 = legacyLoadState()

  if (!database.isValid() && state3) {
    console.log('Migrating state_v3 to new format.')
    database.init(
      {
        debugging: state3.debugging,
        homeConceptId: state3.homeConceptId,
        viewingConceptId: state3.viewingConceptId,
      },
      Object.values(state3.conceptMap)
    )
  }

  /**
   * Migrate state4 to new database.
   *
   * We need to test isValid() or we cannot distinguish uninitialized from
   * State4.
   */
  const isState4 = database.isValid() && isNaN(database.getVersion())
  if (isState4) {
    const allConcepts = (database.getAllConcepts() as unknown) as Concept4[]
    allConcepts.forEach((c: Concept4) =>
      database.updateConcept({
        id: c.id,
        camera: {
          focus: { x: 0, y: 0 },
          scale: 1,
        },
        drawing: c.drawing,
        references: c.details.map(d => ({
          id: d.id,
          to: d.to,
          posType: PositionType.Normal,
          pos: d.position,
          size: { w: d.width, h: 'auto' },
        })),
        summary: c.summary,
      })
    )

    database.createConcept(toolMaskConcept)
    toolConcepts.forEach(c => database.createConcept(c))
    database.setVersion(5)
  }

  ReactDOM.render(
    React.createElement(App, { db: database, factoryRegistry }),
    document.getElementById('react-root')
  )
}
