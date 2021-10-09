import { BlockId, ConceptId, TypedConcept } from '../../core/interfaces'

export interface Backlink {
  concept: TypedConcept<unknown>
  blockId: BlockId
}

export function getBacklinksOf(
  conceptId: ConceptId,
  inConcepts: TypedConcept<unknown>[]
): Backlink[] {
  return inConcepts.reduce(
    (backlinks: Backlink[], inConcept: TypedConcept<unknown>) => {
      const blocksReferencingConcept = inConcept.references.filter(
        r => r.to === conceptId
      )
      return backlinks.concat(
        blocksReferencingConcept.map(b => ({
          concept: inConcept,
          blockId: b.id,
        }))
      )
    },
    [] as Backlink[]
  )
}
