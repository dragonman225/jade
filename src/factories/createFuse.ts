import Fuse from 'fuse.js'

import { FactoryRegistry, TypedConcept } from '../core/interfaces'

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
  /**
   * See the documentation of Fuse.js
   * https://fusejs.io/api/options.html
   * and Dendron's setup
   * https://github.com/dendronhq/dendron/blob/62898cfe554aede02477f383aa56e47799e14e58/packages/common-all/src/fuse.ts#L75
   * for reference.
   */
  const options: Fuse.IFuseOptions<TypedConcept<unknown>> = {
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
  return new Fuse(searchableConcepts, options)
}
