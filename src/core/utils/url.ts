import { Block, BlockInstance, TypedConcept } from '../interfaces'

export function getUrlForConcept(concept: TypedConcept<unknown>): string {
  return `jade://v1/concept/${concept.id}`
}

export function getUrlForBlock(
  concept: TypedConcept<unknown>,
  block: BlockInstance | Block
): string {
  return `jade://v1/concept/${concept.id}/${block.id}`
}

interface InternalUrl {
  conceptId?: string
  blockId?: string
}

export function resolveInternalUrl(url: string): InternalUrl {
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
