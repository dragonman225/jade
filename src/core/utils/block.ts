import { Block, BlockInstance, Concept, InteractionMode } from '../interfaces'

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
