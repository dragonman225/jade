import { v4 as uuidv4 } from 'uuid'
import { NestedCSSProperties } from 'typestyle/lib/types'

import {
  centerPointOf,
  isBoxBoxIntersectingObjVer,
  isPointInRect,
} from './math'
import { blockRectManager } from './element-pool'
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
  properties: Pick<Block, 'pos' | 'posType' | 'size' | 'to'>
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

export function createBlockInstance(block: Block): BlockInstance {
  return {
    id: block.id,
    posType: block.posType,
    pos: block.pos,
    size: block.size,
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
    const blockRect = blockRectManager.getRect(block.id)
    return (
      !!blockRect &&
      isBoxBoxIntersectingObjVer(box, {
        x: blockRect.x,
        y: blockRect.y,
        w: blockRect.width,
        h: blockRect.height,
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
  const rect = blockRectManager.getRect(block.id) || { width: 0, height: 0 }

  return {
    ...block.pos,
    w: rect.width,
    h: rect.height,
  }
}

export function deselectAllBlocks(blocks: BlockInstance[]): BlockInstance[] {
  return blocks.map(b => updateBlockInstance(b, { selected: false }))
}

export function getOverBlock(
  pointerInEnvCoords: Vec2,
  blocks: BlockInstance[],
  excludeBlockIds: BlockId[] = []
): BlockInstance | undefined {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]
    const blockRect = blockRectManager.getRect(block.id)
    if (
      blockRect &&
      !excludeBlockIds.includes(block.id) &&
      isPointInRect(pointerInEnvCoords, blockRect)
    )
      return block
  }
  return undefined
}

export function getFocusForBlock(
  blockId: BlockId,
  scale: Camera['scale']
): Vec2 | undefined {
  const blockRect = blockRectManager.getRect(blockId)
  const center =
    blockRect &&
    centerPointOf({
      ...blockRect,
      w: blockRect.width,
      h: blockRect.height,
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
