import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { AppRoot } from './App'
import { isNaN } from './utils'
import { factoryRegistry } from '../factories'
import { legacyLoadState } from './utils/db-legacy'
import {
  toolConcepts,
  toolMaskConcept,
  initialConcepts,
} from '../initial-concepts'
import env from '../env'
import { Concept4, DatabaseInterface, PositionType } from './interfaces'

/** Render the app with platform-specific resources. */
export function startApp(
  database: DatabaseInterface,
  openExternal: (link: string) => void
): void {
  /** Set title. */
  document.title = `Jade v${env.JADE_VER}`

  /** Migrate old state_v3 to the new database. */
  const state3 = legacyLoadState()

  if (!database.isValid() && state3) {
    console.log('core/index: Migrating state_v3')
    database.init(
      {
        debugging: state3.debugging,
        homeConceptId: state3.homeConceptId,
        viewingConceptId: state3.viewingConceptId,
      },
      Object.values(state3.conceptMap).map(c => ({
        ...c,
        relations: [],
      }))
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
    console.log('core/index: Migrating state4')
    const allConcepts = (database.getAllConcepts() as unknown) as Concept4[]
    const migrationTime = Date.now()
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
          createdTime: migrationTime,
          lastEditedTime: migrationTime,
        })),
        relations: [],
        summary: c.summary,
        createdTime: migrationTime,
        lastEditedTime: migrationTime,
      })
    )

    database.createConcept(toolMaskConcept)
    toolConcepts.forEach(c => database.createConcept(c))
    database.setVersion(5)
  }

  /** Bootstrap new database. */
  if (!database.isValid()) {
    console.log('core/index: Bootstrap new db')
    database.init(
      {
        debugging: false,
        homeConceptId: 'home',
        /** Set viewing concept to the tutorial. */
        viewingConceptId: 'b1f78b9d-eebd-4d94-b3e3-ba80b54769ff',
      },
      initialConcepts
    )
  }

  ReactDOM.render(
    React.createElement(AppRoot, {
      db: database,
      openExternal,
      factoryRegistry,
    }),
    document.getElementById('react-root')
  )
}
