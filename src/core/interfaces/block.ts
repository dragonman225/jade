import { ConceptId } from './concept'
import { Size, Timestamp, Vec2 } from './util'

/** Describe how to position an object in the *Canvas*. */
export enum PositionType {
  /** The object is not positioned. */
  None,
  /** The object is positioned relative to the environment origin. */
  Normal,
  /** The object is positioned relative to the corners of the viewport. */
  PinnedTL,
  PinnedTR,
  PinnedBL,
  PinnedBR,
}

/** Describe what the user is doing to an object. */
export enum InteractionMode {
  Idle,
  Moving,
  Resizing,
  Focusing,
}

/** An UUID identifying a *Block*. */
export type BlockId = string

/** A pointer to a *Concept* in a *Canvas*. */
export interface Block {
  id: BlockId
  // TODO: Change property name.
  to: ConceptId
  posType: PositionType
  pos: Vec2
  size: Size
  createdTime: Timestamp
  lastEditedTime: Timestamp
}

/** A live representation of a *Block* in the UI. */
export interface BlockInstance {
  id: BlockId
  posType: PositionType
  pos: Vec2
  size: Size
  mode: InteractionMode
  selected: boolean
  highlighted: boolean
  conceptId: ConceptId
  createdTime: Timestamp
  lastEditedTime: Timestamp
}
