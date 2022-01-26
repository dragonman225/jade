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
import { Concept4, PlatformDatabaseInterface, PositionType } from './interfaces'
import { migrateSettings } from './utils/settings'
import { withFullTextSearch } from './utils/withFullTextSearch'

// TODO: Move migration and loading to React and keep startApp sync.
/** Render the app with platform-specific resources. */
export async function startApp(
  platformDatabase: PlatformDatabaseInterface,
  openExternal: (link: string) => void
): Promise<void> {
  /** Set document title. */
  document.title = `Jade v${env.JADE_VER}`

  /** Init full text search. */
  const database = withFullTextSearch(platformDatabase, factoryRegistry)

  /** Migrate old state_v3 to the new database. */
  const state3 = legacyLoadState()

  if (!(await database.isValid()) && state3) {
    console.log('core/index: Migrating state_v3')
    database.init(
      {
        shouldEnableDevMode: state3.debugging,
        shouldEnableEfficientRendering: true,
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
  const isState4 = (await database.isValid()) && isNaN(database.getVersion())
  if (isState4) {
    console.log('core/index: Migrating state4')
    const allConcepts = ((await database.getAllConcepts()) as unknown) as Concept4[]
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

  /** Migrate settings. */
  if (await database.isValid()) {
    const oldSettings = database.getSettings()
    const newSettings = migrateSettings(oldSettings)
    database.saveSettings(newSettings)
  }

  /** Bootstrap new database. */
  if (!(await database.isValid())) {
    console.log('core/index: Bootstrap new db')
    database.init(
      {
        homeConceptId: 'home',
        /** Set viewing concept to the tutorial. */
        viewingConceptId: 'b1f78b9d-eebd-4d94-b3e3-ba80b54769ff',
        shouldEnableDevMode: false,
        shouldEnableEfficientRendering: true,
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
