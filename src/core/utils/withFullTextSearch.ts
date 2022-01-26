import Fuse from 'fuse.js'

import {
  DatabaseInterface,
  FactoryRegistry,
  PlatformDatabaseInterface,
  TypedConcept,
} from '../interfaces'

/**
 * See the documentation of Fuse.js
 * https://fusejs.io/api/options.html
 * and Dendron's setup
 * https://github.com/dendronhq/dendron/blob/62898cfe554aede02477f383aa56e47799e14e58/packages/common-all/src/fuse.ts#L75
 * for reference.
 */
export const fuseOptions: Fuse.IFuseOptions<TypedConcept<unknown>> = {
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

/** Decorate platform database with full text search capability. */
export function withFullTextSearch(
  platformDatabase: PlatformDatabaseInterface,
  factoryRegistry: FactoryRegistry
): DatabaseInterface {
  /** Init full text search engine. */
  const fuse = new Fuse<TypedConcept<unknown>>([], fuseOptions)
  initFuse().catch(error => {
    throw error
  })

  /** Get all concepts and put into Fuse. This is an expensive operation! */
  async function initFuse() {
    const concepts = await platformDatabase.getAllConcepts()
    const searchableConcepts = concepts.map(getSearchableConcept)
    fuse.setCollection(searchableConcepts)
  }

  function getSearchableConcept(concept: TypedConcept<unknown>) {
    return {
      ...concept,
      summary: {
        ...concept.summary,
        text: factoryRegistry.getConceptString(concept),
      },
    }
  }

  return {
    ...platformDatabase,
    init: (_, concepts) => {
      fuse.setCollection(concepts.map(getSearchableConcept))
      return platformDatabase.init(_, concepts)
    },
    createConcept: concept => {
      fuse.add(getSearchableConcept(concept))
      platformDatabase.createConcept(concept)
    },
    updateConcept: concept => {
      fuse.remove(c => c.id === concept.id)
      fuse.add(getSearchableConcept(concept))
      platformDatabase.updateConcept(concept)
    },
    searchConceptByText: (pattern, options) => fuse.search(pattern, options),
  }
}
