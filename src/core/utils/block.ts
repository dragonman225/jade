import { v4 as uuidv4 } from 'uuid'

import { isBoxBoxIntersectingObjVer } from './math'
import {
  Block,
  BlockId,
  BlockInstance,
  Box,
  InteractionMode,
  PositionType,
  TypedConcept,
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

export function createBlockInstance(
  block: Block,
  concept: TypedConcept<unknown>
): BlockInstance {
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
    concept,
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
    to: blockInstance.concept.id,
    posType: blockInstance.posType,
    pos: blockInstance.pos,
    size: blockInstance.size,
    createdTime: blockInstance.createdTime,
    lastEditedTime: blockInstance.lastEditedTime,
  }
}

export function getSelectedBlockIds(
  blocks: BlockInstance[],
  selectionBox: Box
): BlockId[] {
  return blocks
    .map(b => {
      /** TODO: Resolve 'auto' to actual size. */
      const { size } = b
      return {
        ...b,
        size: {
          w: size.w === 'auto' ? 0 : size.w,
          h: size.h === 'auto' ? 0 : size.h,
        },
      }
    })
    .filter(
      /** Filter out pinned blocks. */
      b =>
        b.posType === PositionType.Normal &&
        isBoxBoxIntersectingObjVer(selectionBox, {
          ...b.pos,
          ...b.size,
        })
    )
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
