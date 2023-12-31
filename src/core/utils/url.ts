import { Block, BlockInstance, ConceptId, TypedConcept } from '../interfaces'

export function getUrlForConcept(concept: TypedConcept<unknown>): string {
  return `jade://v1/concept/${concept.id}`
}

export function getUrlForConceptId(conceptId: ConceptId): string {
  return `jade://v1/concept/${conceptId}`
}

export function getUrlForBlock(
  concept: TypedConcept<unknown>,
  block: BlockInstance | Block
): string {
  return `jade://v1/concept/${concept.id}/${block.id}`
}

interface ResolvedInternalUrl {
  conceptId?: string
  blockId?: string
}

export function resolveInternalUrl(url: string): ResolvedInternalUrl {
  const splits = url.split('/')
  const anchorIndex = splits.findIndex(s => s === 'concept')
  return {
    conceptId: splits[anchorIndex + 1],
    blockId: splits[anchorIndex + 2],
  }
}

export function isInternalUrl(url: string): boolean {
  return url.startsWith('jade://')
}
