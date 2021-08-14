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

const elementRectMap = new Map<BlockId, DOMRect>()

export function setElementRect(blockId: BlockId, rect: DOMRect): void {
  console.log('setElementRect', blockId, rect)
  elementRectMap.set(blockId, rect)
}

export function getElementRect(blockId: BlockId): DOMRect | undefined {
  return elementRectMap.get(blockId)
}

export function deleteElementRects(blockIds: BlockId[]): void {
  blockIds.forEach(id => elementRectMap.delete(id))
}

export function clearElementRectMap(): void {
  elementRectMap.clear()
}
