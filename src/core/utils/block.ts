import { v4 as uuidv4 } from 'uuid'
import { NestedCSSProperties } from 'typestyle/lib/types'

import {
  centerPointOf,
  isBoxBoxIntersectingObjVer,
  isPointInRect,
} from './math'
import { blockRectManager } from './blockRectManager'
import {
  Block,
  BlockColor,
  BlockId,
  BlockInstance,
  Box,
  Camera,
  InteractionMode,
  PositionType,
  Vec2,
} from '../interfaces'

export function createBlock(
  properties: Pick<Block, 'pos' | 'posType' | 'size' | 'to'> &
    Partial<Pick<Block, 'color'>>
): Block {
  return {
    id: uuidv4(),
    createdTime: Date.now(),
    lastEditedTime: Date.now(),
    ...properties,
  }
}

export function updateBlock(
  block: Block,
  newProperties: Partial<
    Pick<Block, 'pos' | 'posType' | 'size' | 'to' | 'color'>
  >
): Block {
  return {
    ...block,
    ...newProperties,
    lastEditedTime: Date.now(),
  }
}

export function createBlockInstance(
  block: Block,
  zIndex: number
): BlockInstance {
  return {
    id: block.id,
    posType: block.posType,
    pos: block.pos,
    size: block.size,
    zIndex,
    color: block.color,
    createdTime: block.createdTime,
    lastEditedTime: block.lastEditedTime,
    mode: InteractionMode.Idle,
    selected: false,
    highlighted: false,
    conceptId: block.to,
  }
}

export function updateBlockInstance(
  blockInstance: BlockInstance,
  newProperties: Partial<
    Pick<
      BlockInstance,
      'mode' | 'pos' | 'posType' | 'selected' | 'size' | 'highlighted' | 'color'
    >
  >
): BlockInstance {
  const hasOwnProperty = (obj: unknown, key: string) => {
    return Object.prototype.hasOwnProperty.call(obj, key) as boolean
  }

  return {
    ...blockInstance,
    ...newProperties,
    lastEditedTime:
      hasOwnProperty(newProperties, 'pos') ||
      hasOwnProperty(newProperties, 'posType') ||
      hasOwnProperty(newProperties, 'size')
        ? Date.now()
        : blockInstance.lastEditedTime,
  }
}

export function blockInstanceToBlock(blockInstance: BlockInstance): Block {
  return {
    id: blockInstance.id,
    to: blockInstance.conceptId,
    posType: blockInstance.posType,
    pos: blockInstance.pos,
    size: blockInstance.size,
    color: blockInstance.color,
    createdTime: blockInstance.createdTime,
    lastEditedTime: blockInstance.lastEditedTime,
  }
}

/** A filter that pass-through normal positioned blocks. */
export function isNormalPositioned(block: BlockInstance): boolean {
  return block.posType === PositionType.Normal
}

/**
 * A filter creator to create a filter that pass-through blocks that are
 * intersecting with a box.
 */
export function isIntersectingWithBox(
  box: Box
): (block: BlockInstance) => boolean {
  return function (block): boolean {
    const blockSize = blockRectManager.getMeasuredSize(block.id)
    return (
      !!blockSize &&
      isBoxBoxIntersectingObjVer(box, {
        x: block.pos.x,
        y: block.pos.y,
        w: blockSize.width,
        h: blockSize.height,
      })
    )
  }
}

/** Get ids of selected blocks, using `blockRectManager` to get rects. */
export function getSelectedBlockIds(
  blocks: BlockInstance[],
  selectionBox: Box
): BlockId[] {
  const isIntersectingWithSelectionBox = isIntersectingWithBox(selectionBox)

  return blocks
    .filter(isNormalPositioned)
    .filter(isIntersectingWithSelectionBox)
    .map(b => b.id)
}

export function findBlock(
  blocks: BlockInstance[],
  id: BlockId
): BlockInstance | undefined {
  return blocks.find(b => id === b.id)
}

export function blockToBox(block: BlockInstance): Box {
  const blockSize = blockRectManager.getMeasuredSize(block.id) || {
    width: 0,
    height: 0,
  }

  return {
    x: block.pos.x,
    y: block.pos.y,
    w: blockSize.width,
    h: blockSize.height,
  }
}

export function deselectAllBlocks(blocks: BlockInstance[]): BlockInstance[] {
  return blocks.map(b => updateBlockInstance(b, { selected: false }))
}

export function isPointInBlock(
  pointerInEnvCoords: Vec2,
  block: BlockInstance,
  camera: Camera,
  /** TODO: `windowSize` should be part of `camera`. */
  windowSize: { w: number; h: number }
): boolean {
  const pos = block.pos
  const size = blockRectManager.getMeasuredSize(block.id)
  if (!size) return false

  if (block.posType === PositionType.None) return false

  if (block.posType === PositionType.Normal) {
    return isPointInRect(pointerInEnvCoords, {
      left: block.pos.x,
      right: block.pos.x + size.width,
      top: block.pos.y,
      bottom: block.pos.y + size.height,
    })
  }

  switch (block.posType) {
    /**
     * A pinned block's position and size are fixed in viewport
     * coordinates, but they are dependent of the camera offset and scale.
     */
    case PositionType.PinnedTL: {
      return isPointInRect(pointerInEnvCoords, {
        left: camera.focus.x + pos.x / camera.scale,
        right: camera.focus.x + (pos.x + size.width) / camera.scale,
        top: camera.focus.y + pos.y / camera.scale,
        bottom: camera.focus.y + (pos.y + size.height) / camera.scale,
      })
    }
    case PositionType.PinnedTR: {
      return isPointInRect(pointerInEnvCoords, {
        left:
          camera.focus.x + (windowSize.w - pos.x - size.width) / camera.scale,
        right: camera.focus.x + (windowSize.w - pos.x) / camera.scale,
        top: camera.focus.y + pos.y / camera.scale,
        bottom: camera.focus.y + (pos.y + size.height) / camera.scale,
      })
    }
    case PositionType.PinnedBL: {
      return isPointInRect(pointerInEnvCoords, {
        left: camera.focus.x + pos.x / camera.scale,
        right: camera.focus.x + (pos.x + size.width) / camera.scale,
        top:
          camera.focus.y + (windowSize.h - pos.y - size.height) / camera.scale,
        bottom: camera.focus.y + (windowSize.h - pos.y) / camera.scale,
      })
    }
    case PositionType.PinnedBR: {
      return isPointInRect(pointerInEnvCoords, {
        left:
          camera.focus.x + (windowSize.w - pos.x - size.width) / camera.scale,
        right: camera.focus.x + (windowSize.w - pos.x) / camera.scale,
        top:
          camera.focus.y + (windowSize.h - pos.y - size.height) / camera.scale,
        bottom: camera.focus.y + (windowSize.h - pos.y) / camera.scale,
      })
    }
    default: {
      return false
    }
  }
}

export function getOverBlock(
  pointerInEnvCoords: Vec2,
  blocks: BlockInstance[],
  camera: Camera,
  excludeBlockIds: BlockId[] = [],
  excludeNonNormalPositioned = false
): BlockInstance | undefined {
  const windowSize = { w: window.innerWidth, h: window.innerHeight }

  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]

    if (excludeBlockIds.includes(block.id)) continue
    if (excludeNonNormalPositioned && block.posType !== PositionType.Normal) {
      continue
    }

    if (isPointInBlock(pointerInEnvCoords, block, camera, windowSize)) {
      return block
    }
  }
  return undefined
}

export function getFocusForBlock(
  block: Block | BlockInstance,
  scale: Camera['scale']
): Vec2 | undefined {
  const center = centerPointOf({
    x: block.pos.x,
    y: block.pos.y,
    w: block.size.w === 'auto' ? 300 : block.size.w,
    h: block.size.h === 'auto' ? 350 : block.size.h,
  })
  const winW = window.innerWidth
  const winH = window.innerHeight
  return (
    center && {
      x: center.x - winW / 2 / scale,
      y: center.y - winH / 2 / scale,
    }
  )
}

export const blockColorMixin: NestedCSSProperties = {
  $nest: {
    [`&[data-color="${BlockColor.BackgroundRed}"]`]: {
      background: 'var(--bg-red)',
    },
    [`&[data-color="${BlockColor.BackgroundOrange}"]`]: {
      background: 'var(--bg-orange)',
    },
    [`&[data-color="${BlockColor.BackgroundYellow}"]`]: {
      background: 'var(--bg-yellow)',
    },
    [`&[data-color="${BlockColor.BackgroundGreen}"]`]: {
      background: 'var(--bg-green)',
    },
    [`&[data-color="${BlockColor.BackgroundBlue}"]`]: {
      background: 'var(--bg-blue)',
    },
    [`&[data-color="${BlockColor.BackgroundPurple}"]`]: {
      background: 'var(--bg-purple)',
    },
    [`&[data-color="${BlockColor.BackgroundPink}"]`]: {
      background: 'var(--bg-pink)',
    },
    [`&[data-color="${BlockColor.BackgroundBrown}"]`]: {
      background: 'var(--bg-brown)',
    },
    [`&[data-color="${BlockColor.BackgroundGrey}"]`]: {
      background: 'var(--bg-grey)',
    },
  },
}

export function bringBlocksToTop(
  blockIds: BlockId[],
  blocks: BlockInstance[],
  operation?: (movedBlock: BlockInstance) => BlockInstance
): BlockInstance[] {
  const newBlockMap: Record<BlockId, BlockInstance> = {}

  const topBlocksZIndexStart = blocks.length - blockIds.length
  const topBlocksZIndexOrder = blocks
    .filter(b => blockIds.includes(b.id))
    .sort((b1, b2) => b1.zIndex - b2.zIndex)

  for (let i = 0; i < topBlocksZIndexOrder.length; i++) {
    const block = topBlocksZIndexOrder[i]
    const newBlock = { ...block, zIndex: topBlocksZIndexStart + i }
    newBlockMap[block.id] = operation ? operation(newBlock) : newBlock
  }

  const otherBlocksZIndexOrder = blocks
    .filter(b => !blockIds.includes(b.id))
    .sort((b1, b2) => b1.zIndex - b2.zIndex)

  for (let i = 0; i < otherBlocksZIndexOrder.length; i++) {
    const block = otherBlocksZIndexOrder[i]
    newBlockMap[block.id] = { ...block, zIndex: i }
  }

  return blocks.map(b => newBlockMap[b.id])
}

export function isMovingBlocks(blocks: BlockInstance[]): boolean {
  return !!blocks.find(b => b.mode === InteractionMode.Moving)
}
