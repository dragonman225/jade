import { Concept, FactoryRegistry, TypedConcept } from '../../core/interfaces'

function lastEditedTimeDescending(
  c1: TypedConcept<unknown>,
  c2: TypedConcept<unknown>
) {
  const mtimeC1 = c1.lastEditedTime || 0
  const mtimeC2 = c2.lastEditedTime || 0
  return mtimeC2 - mtimeC1
}

export interface CanvasItem {
  type: 'canvas'
  canvasId: string
  concept: TypedConcept<unknown>
}

export interface BlockItem {
  type: 'block'
  canvasId: string
  blockId: string
  concept: TypedConcept<unknown>
}

interface SearchResult {
  canvases: CanvasItem[]
  blocks: BlockItem[]
}

export function getSearchResult(
  keyword: string,
  concepts: TypedConcept<unknown>[],
  factoryRegistry: FactoryRegistry
): SearchResult {
  const matches: { [key: string]: TypedConcept<unknown> } = {}
  const parentMap: { [key: string]: string[] } = {}

  for (let i = 0; i < concepts.length; ++i) {
    const c = concepts[i]

    c.references.forEach(r => {
      if (parentMap[r.to]) parentMap[r.to].push(c.id)
      else parentMap[r.to] = [c.id]
    })

    if (
      keyword &&
      !factoryRegistry
        .getConceptString(c)
        .toLocaleLowerCase()
        .includes(keyword.toLocaleLowerCase())
    )
      continue

    matches[c.id] = c
  }

  const result: SearchResult = { canvases: [], blocks: [] }

  concepts.forEach(concept => {
    /** Is a match, as a canvas. */
    if (matches[concept.id]) {
      if (Concept.isHighOrder(concept)) {
        result.canvases.push({ type: 'canvas', canvasId: concept.id, concept })
      }
    }

    /** Is a match, as a block. */
    concept.references.forEach(reference => {
      if (matches[reference.to]) {
        result.blocks.push({
          type: 'block',
          canvasId: concept.id,
          blockId: reference.id,
          concept: matches[reference.to],
        })
      }
    })
  })

  return {
    canvases: result.canvases.sort((a, b) =>
      lastEditedTimeDescending(a.concept, b.concept)
    ),
    blocks: result.blocks.sort((a, b) =>
      lastEditedTimeDescending(a.concept, b.concept)
    ),
  }
}
