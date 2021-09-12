import { v4 as uuidv4 } from 'uuid'

import { isBoxBoxIntersectingObjVer } from './math'
import {
  Block,
  BlockId,
  BlockInstance,
  Box,
  InteractionMode,
  PositionType,
} from '../interfaces'
import { blockRectManager } from './element-pool'

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
  newProperties: Partial<Pick<Block, 'pos' | 'posType' | 'size' | 'to'>>
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
      'mode' | 'pos' | 'posType' | 'selected' | 'size' | 'highlighted'
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
