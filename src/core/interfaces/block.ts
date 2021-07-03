import { Concept, ConceptId } from './concept'
import { Size, Vec2 } from './util'

export enum PositionType {
  /** Not positioned, the `position` property has no meaning. */
  None,
  /** Position relative to environment origin. */
  Normal,
  /**
   * Position relative to viewport top-left, top-right, bottom-left,
   * bottom-right.
   */
  PinnedTL,
  PinnedTR,
  PinnedBL,
  PinnedBR,
}

export enum InteractionMode {
  Idle,
  Moving,
  Resizing,
  Focusing,
}

export type BlockId = string

/** A Block is an object representation of a Concept. */
export interface Block {
  id: BlockId
  // TODO: Change property name.
  to: ConceptId
  posType: PositionType
  pos: Vec2
  size: Size
}

export interface BlockInstance {
  id: BlockId
  posType: PositionType
  pos: Vec2
  size: Size
  mode: InteractionMode
  selected: boolean
  concept: Concept
}
