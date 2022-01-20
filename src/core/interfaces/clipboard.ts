import { Block } from './block'
import { Relation } from './relation'
import { Vec2 } from './util'

export interface Clip {
  /** Offset from pointet position when pasting. */
  pasteOffset: Vec2
  /** Position should be normalized (top-left of bounding box is (0, 0)). */
  blocks: Block[]
  relations: Relation<unknown>[]
}
