import * as React from 'react'
import { useMemo } from 'react'

import { BlockList } from './BlockList'
import { BlockInstance, Camera } from '../interfaces'
import { isBoxBoxIntersectingObjVer } from '../utils'
import { blockRectManager } from '../utils/blockRectManager'

interface Props {
  blocks: BlockInstance[]
  camera: Camera
  shouldRenderOnlyVisible: boolean
  /**
   * Return `true` to let the block go into efficient rendering pipeline.
   *
   * Should be stable, or the list will re-render even when other props
   * don't change.
   */
  selectBlock: (block: BlockInstance) => boolean
  onRender?: () => void
}

export function EfficientBlockList({
  blocks,
  camera,
  shouldRenderOnlyVisible,
  selectBlock,
  onRender,
}: Props): JSX.Element {
  const visibleBlocks = useMemo(() => {
    if (!shouldRenderOnlyVisible) {
      return blocks.filter(selectBlock)
    }

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const overscanX = 0 /*windowWidth * 0.25*/
    const overscanY = 0 /*windowHeight * 0.25*/
    const visibleArea = {
      x: camera.focus.x - overscanX,
      y: camera.focus.y - overscanY,
      w: windowWidth / camera.scale + 2 * overscanX,
      h: windowHeight / camera.scale + 2 * overscanY,
    }
    const blockSizes = blocks.map(b => blockRectManager.getMeasuredSize(b.id))

    return blocks.filter((b, index) => {
      const blockSize = blockSizes[index]

      return (
        selectBlock(b) &&
        /**
         * If a Block haven't reported its rect, render it anyway so it can
         * report. Usually this happens when opening a Canvas and
         * double-clicking to create a new Block + Concept.
         */
        (!blockSize ||
          isBoxBoxIntersectingObjVer(
            {
              x: b.pos.x,
              y: b.pos.y,
              w: typeof b.size.w === 'number' ? b.size.w : blockSize.width,
              h: typeof b.size.h === 'number' ? b.size.h : blockSize.height,
            },
            visibleArea
          ))
      )
    })
  }, [blocks, camera, shouldRenderOnlyVisible, selectBlock])

  return <BlockList blocks={visibleBlocks} onRender={onRender} />
}
