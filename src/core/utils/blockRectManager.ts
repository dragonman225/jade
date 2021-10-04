import { BlockId, Camera } from '../interfaces'
import { viewportRectToEnvRect } from './math'

interface BlockInfo {
  el: HTMLDivElement
  cachedEnvRect: Omit<DOMRect, 'toJSON'>
  alive: boolean
}

export class BlockRectManager {
  private camera: Camera
  private blockInfoMap: Map<BlockId, BlockInfo>

  constructor() {
    this.blockInfoMap = new Map<BlockId, BlockInfo>()
  }

  setElement = (blockId: BlockId, el: HTMLDivElement): void => {
    this.blockInfoMap.set(blockId, {
      alive: true,
      /**
       * Calling getBoundingClientRect here forces reflow, which is bad for
       * performance.
       * viewportRectToEnvRect(
       *  el.getBoundingClientRect(),
       *  this.camera
       * )
       */
      cachedEnvRect: undefined,
      el,
    })
  }

  /**
   * React removes an element from DOM before calling effect cleanup
   * function, so calling `getBoundingClientRect()` here is useless since
   * it only gets zeros. To get valid rect to cache we need to do it in
   * `setElement()` and `getRect()`.
   */
  detachElement = (blockId: BlockId): void => {
    const info = this.blockInfoMap.get(blockId)
    if (info) {
      this.blockInfoMap.set(blockId, {
        alive: false,
        cachedEnvRect: info.cachedEnvRect,
        el: undefined,
      })
    }
  }

  getRect = (blockId: BlockId): Omit<DOMRect, 'toJSON'> | undefined => {
    const info = this.blockInfoMap.get(blockId)
    if (!info) return undefined
    if (info.el) {
      const viewportRect = info.el.getBoundingClientRect()
      const envRect = viewportRectToEnvRect(viewportRect, this.camera)
      this.blockInfoMap.set(blockId, {
        alive: true,
        cachedEnvRect: envRect,
        el: info.el,
      })
      return envRect
    } else {
      return info.cachedEnvRect
    }
  }

  updateCamera = (camera: Camera): void => {
    this.camera = camera
  }

  clear = (): void => {
    this.blockInfoMap.clear()
  }

  deleteBlocks = (blockIds: BlockId[]): void => {
    blockIds.forEach(id => {
      this.blockInfoMap.delete(id)
    })
  }
}

export const blockRectManager = new BlockRectManager()
