import { BlockId, Camera } from '../interfaces'
import { viewportRectToEnvRect } from './math'

interface BlockInfo {
  el: HTMLDivElement | undefined
  cachedEnvRect: Omit<DOMRect, 'toJSON'> | undefined
  alive: boolean
}

/** Only update on size change. */
export class BlockRectManager {
  private camera: Camera
  private blockInfoMap: Map<BlockId, BlockInfo>
  private ro: ResizeObserver

  constructor() {
    this.blockInfoMap = new Map<BlockId, BlockInfo>()
    this.ro = new ResizeObserver(entries => {
      /** `transform: scale()` isn't counted as resize */
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const el = entry.target as HTMLDivElement
        const blockId = el.dataset.blockId
        if (!blockId) continue
        const viewportRect = el.getBoundingClientRect()
        /** reproduce bug: go to A, zoom out, pan, zoom in to B, selection broken around B */
        /** Camera.scale doesn't reflect the actual transform: scale */
        const envRect = viewportRectToEnvRect(viewportRect, this.camera)
        // console.log(
        //   'resize',
        //   blockId,
        //   this.camera.scale,
        //   viewportRect,
        //   envRect,
        //   entry.borderBoxSize
        // )
        this.blockInfoMap.set(blockId, {
          alive: true,
          cachedEnvRect: {
            top: envRect.top,
            right: envRect.right,
            bottom: envRect.bottom,
            left: envRect.left,
            x: envRect.x,
            y: envRect.y,
            /** borderBoxSize seems to have higher chance to be right */
            width: entry.borderBoxSize[0].inlineSize,
            height: entry.borderBoxSize[0].blockSize,
          },
          el,
        })
      }
    })
  }

  setElement = (blockId: BlockId, el: HTMLDivElement): void => {
    // getBoundingClientRect here is bad for performance
    // const viewportRect = el.getBoundingClientRect()
    // const envRect = viewportRectToEnvRect(viewportRect, this.camera)
    this.blockInfoMap.set(blockId, {
      alive: true,
      cachedEnvRect: undefined,
      el,
    })
    el.dataset.blockId = blockId
    this.ro.observe(el)
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
      if (info.el) this.ro.unobserve(info.el)
      this.blockInfoMap.set(blockId, {
        alive: false,
        cachedEnvRect: info.cachedEnvRect,
        el: undefined,
      })
    }
  }

  /**
   * Get measured size in environment coordinates. Since there's caching,
   * calling this function has low cost, and you can still get it when
   * a block is temporarily not rendered.
   */
  getMeasuredSize = (
    blockId: BlockId
  ): { width: number; height: number } | undefined => {
    const info = this.blockInfoMap.get(blockId)
    if (!info) return undefined
    return info.cachedEnvRect
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
