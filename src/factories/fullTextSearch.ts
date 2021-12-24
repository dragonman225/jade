import { useEffect } from 'react'
import Fuse from 'fuse.js'

import {
  DatabaseInterface,
  FactoryRegistry,
  TypedConcept,
} from '../core/interfaces'

/**
 * TODO:
 * - Try elasticlunr
 */

/**
 * See the documentation of Fuse.js
 * https://fusejs.io/api/options.html
 * and Dendron's setup
 * https://github.com/dendronhq/dendron/blob/62898cfe554aede02477f383aa56e47799e14e58/packages/common-all/src/fuse.ts#L75
 * for reference.
 */
const fuseOptions: Fuse.IFuseOptions<TypedConcept<unknown>> = {
  threshold: 0.2,
  distance: 15,
  keys: [
    {
      name: 'summary.type',
      weight: 0.2,
    },
    {
      name: 'summary.text',
      weight: 0.8,
    },
  ],
  useExtendedSearch: true,
  includeScore: true,
  ignoreLocation: true,
  ignoreFieldNorm: true,
}

export function createFuse(
  concepts: TypedConcept<unknown>[],
  factoryRegistry: FactoryRegistry
): Fuse<TypedConcept<unknown>> {
  /** Add text representation to each concept to make it searchable. */
  const searchableConcepts = concepts.map(c => ({
    ...c,
    summary: {
      ...c.summary,
      text: factoryRegistry.getConceptString(c),
    },
  }))

  return new Fuse(searchableConcepts, fuseOptions)
}

/**
 * fuse should be a singleton for the whole app, but below hook can be
 * called at multiple place.
 */
const fuse = new Fuse<TypedConcept<unknown>>([], fuseOptions)
let databaseUpdateIntervalId: NodeJS.Timeout

/** To achieve best performance, please provide stable variables. */
export function useFullTextSearch(
  database: DatabaseInterface,
  factoryRegistry: FactoryRegistry
): Fuse<TypedConcept<unknown>> {
  useEffect(() => {
    /** Expensive to run! */
    function updateFuse() {
      const concepts = database.getAllConcepts()
      const searchableConcepts = concepts.map(c => ({
        ...c,
        summary: {
          ...c.summary,
          text: factoryRegistry.getConceptString(c),
        },
      }))
      fuse.setCollection(searchableConcepts)
    }

    /** Pull data manually on first run. */
    if (!databaseUpdateIntervalId) {
      updateFuse()

      /**
       * Listen to database changes. Real listen don't work because it
       * triggers crazily for any changes like panning the canvas.
       */
      // database.subscribeConcept('*', updateFuse)
      databaseUpdateIntervalId = setInterval(updateFuse, 10000)
    }

    const intervalId = databaseUpdateIntervalId
    return () => {
      /** Unlisten to obsolete database. */
      // database.unsubscribeConcept('*', updateFuse)
      clearInterval(intervalId)
      databaseUpdateIntervalId = null
    }
  }, [database, factoryRegistry])

  return fuse
}
