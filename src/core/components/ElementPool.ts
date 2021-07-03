import { BlockId } from '../interfaces'

const elementMap = new Map<BlockId, HTMLDivElement>()

export function setElement(blockId: BlockId, el: HTMLDivElement): void {
  elementMap.set(blockId, el)
}

export function getElement(blockId: BlockId): HTMLDivElement | undefined {
  return elementMap.get(blockId)
}

export function deleteElement(blockId: BlockId): void {
  elementMap.delete(blockId)
}
