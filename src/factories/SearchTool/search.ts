import { Concept, FactoryRegistry, TypedConcept } from '../../core/interfaces'

function lastEditedTimeDescending(
  c1: TypedConcept<unknown>,
  c2: TypedConcept<unknown>
) {
  const mtimeC1 = c1.lastEditedTime || 0
  const mtimeC2 = c2.lastEditedTime || 0
  return mtimeC2 - mtimeC1
}

interface SearchResult {
  canvasConcepts: TypedConcept<unknown>[]
  blockConcepts: TypedConcept<unknown>[]
}

export function getSearchResult(
  keyword: string,
  concepts: TypedConcept<unknown>[],
  factoryRegistry: FactoryRegistry
): SearchResult {
  const conceptsWithChildren = []
  const conceptsWithoutChildren = []

  for (let i = 0; i < concepts.length; ++i) {
    const c = concepts[i]

    if (
      keyword &&
      !factoryRegistry
        .getConceptString(c)
        .toLocaleLowerCase()
        .includes(keyword.toLocaleLowerCase())
    )
      continue

    if (Concept.isHighOrder(c)) conceptsWithChildren.push(c)
    else conceptsWithoutChildren.push(c)
  }

  const sortedConceptsWithChildren = conceptsWithChildren.sort(
    lastEditedTimeDescending
  )
  const sortedConceptsWithoutChildren = conceptsWithoutChildren.sort(
    lastEditedTimeDescending
  )

  return {
    canvasConcepts: sortedConceptsWithChildren,
    blockConcepts: sortedConceptsWithoutChildren,
  }
}
