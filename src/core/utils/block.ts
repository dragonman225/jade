import {
  Block,
  BlockInstance,
  DatabaseInterface,
  InteractionMode,
} from '../interfaces'

export function createBlockInstance(
  block: Block,
  db: DatabaseInterface
): BlockInstance {
  return {
    id: block.id,
    posType: block.posType,
    pos: block.pos,
    size: block.size,
    mode: InteractionMode.Idle,
    selected: false,
    concept: db.getConcept(block.to),
  }
}
