import { ReferenceId } from '../interfaces'

const elementMap = new Map<ReferenceId, HTMLDivElement>()

export function setElement(blockId: ReferenceId, el: HTMLDivElement): void {
  elementMap.set(blockId, el)
}

export function getElement(blockId: ReferenceId): HTMLDivElement | undefined {
  return elementMap.get(blockId)
}

export function deleteElement(blockId: ReferenceId): void {
  elementMap.delete(blockId)
}
