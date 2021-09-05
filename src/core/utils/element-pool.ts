import { BlockId, Camera } from '../interfaces'
import { viewportRectToEnvRect } from './math'

export class BlockRectManager {
  private camera: Camera
  private blockElementMap: Map<BlockId, HTMLDivElement>
  private blockRectCacheMap: Map<BlockId, Omit<DOMRect, 'toJSON'>>

  constructor() {
    this.blockElementMap = new Map<BlockId, HTMLDivElement>()
    this.blockRectCacheMap = new Map<BlockId, Omit<DOMRect, 'toJSON'>>()
  }

  setElement = (blockId: BlockId, el: HTMLDivElement): void => {
    this.blockElementMap.set(blockId, el)
    this.blockRectCacheMap.delete(blockId)
  }

  detachElement = (blockId: BlockId): void => {
    const el = this.blockElementMap.get(blockId)
    if (el) {
      this.blockRectCacheMap.set(
        blockId,
        viewportRectToEnvRect(el.getBoundingClientRect(), this.camera)
      )
      this.blockElementMap.delete(blockId)
    }
  }

  getRect = (blockId: BlockId): Omit<DOMRect, 'toJSON'> | undefined => {
    const el = this.blockElementMap.get(blockId)
    if (el) {
      return viewportRectToEnvRect(el.getBoundingClientRect(), this.camera)
    }
    const rect = this.blockRectCacheMap.get(blockId)
    if (rect) return rect
    return undefined
  }

  updateCamera = (camera: Camera): void => {
    this.camera = camera
  }

  clear = (): void => {
    this.blockElementMap.clear()
    this.blockRectCacheMap.clear()
  }

  deleteBlocks = (blockIds: BlockId[]): void => {
    blockIds.forEach(id => {
      this.blockElementMap.delete(id)
      this.blockRectCacheMap.delete(id)
    })
  }
}

export const blockRectManager = new BlockRectManager()
