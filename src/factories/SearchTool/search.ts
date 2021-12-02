import { createFuse } from '../createFuse'
import {
  Concept,
  ConceptId,
  FactoryRegistry,
  TypedConcept,
} from '../../core/interfaces'

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

export interface OrphanItem {
  type: 'orphan'
  canvasId: string // treats as a Canvas for now
  concept: TypedConcept<unknown>
}

export interface SearchResult {
  canvases: CanvasItem[]
  blocks: BlockItem[]
  orphans: OrphanItem[]
}

export function getSearchResult(
  keyword: string,
  concepts: TypedConcept<unknown>[],
  factoryRegistry: FactoryRegistry
): SearchResult {
  const conceptMap: Record<ConceptId, TypedConcept<unknown>> = {}
  const parentMap: { [key: string]: string[] } = {}
  const matches: { [key: string]: TypedConcept<unknown> } = {}

  /** Build matches. */
  const fuseResults = createFuse(concepts, factoryRegistry).search(keyword)
  if (keyword) {
    fuseResults.forEach(r => (matches[r.item.id] = r.item))
  } else {
    /** Everything is a match if keyword is an empty string. */
    concepts.forEach(c => (matches[c.id] = c))
  }

  /** Build parentMap, conceptMap. */
  for (let i = 0; i < concepts.length; ++i) {
    const c = concepts[i]

    /** Add to conceptMap. */
    conceptMap[c.id] = c

    /** Fill in parentMap. */
    c.references.forEach(r => {
      if (parentMap[r.to]) parentMap[r.to].push(c.id)
      else parentMap[r.to] = [c.id]
    })
  }

  const result: SearchResult = { canvases: [], blocks: [], orphans: [] }

  concepts.forEach(concept => {
    /** The concept is a match. */
    if (matches[concept.id]) {
      /** The match has a Canvas representation. */
      if (Concept.isHighOrder(concept)) {
        result.canvases.push({ type: 'canvas', canvasId: concept.id, concept })
      }

      /** The match has a Block representation. */
      const parentConceptIds = parentMap[concept.id]
      if (parentConceptIds) {
        parentConceptIds.forEach(parentConceptId => {
          const block = conceptMap[parentConceptId].references.find(
            r => r.to === concept.id
          )
          if (!block) return
          result.blocks.push({
            type: 'block',
            canvasId: parentConceptId,
            blockId: block.id,
            concept,
          })
        })
      }

      /** The match is an orphan. */
      if (!Concept.isHighOrder(concept) && !parentConceptIds) {
        result.orphans.push({ type: 'orphan', canvasId: concept.id, concept })
      }
    }
  })

  return {
    canvases: result.canvases.sort((a, b) =>
      lastEditedTimeDescending(a.concept, b.concept)
    ),
    blocks: result.blocks.sort((a, b) =>
      lastEditedTimeDescending(a.concept, b.concept)
    ),
    orphans: result.orphans.sort((a, b) =>
      lastEditedTimeDescending(a.concept, b.concept)
    ),
  }
}
