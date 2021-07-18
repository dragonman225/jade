import { isBoxBoxIntersectingObjVer } from './math'
import {
  Block,
  BlockId,
  BlockInstance,
  Box,
  Concept,
  InteractionMode,
  PositionType,
} from '../interfaces'

export function createBlockInstance(
  block: Block,
  concept: Concept,
  existingInstance?: BlockInstance
): BlockInstance {
  return {
    id: block.id,
    posType: block.posType,
    pos: block.pos,
    size: block.size,
    mode: existingInstance ? existingInstance.mode : InteractionMode.Idle,
    selected: existingInstance ? existingInstance.selected : false,
    concept,
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
