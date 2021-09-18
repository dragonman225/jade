import { RelationId } from './relation'
import { Vec2 } from './util'

export enum ContextType {
  InferFromPointer,
  Relation,
}

export type ContextMenuActionData = {
  pointerInViewportCoords: Vec2
} & (
  | {
      contextType: ContextType.InferFromPointer
    }
  | {
      contextType: ContextType.Relation
      relationId: RelationId
    }
)

export interface ContextMenuState {
  shouldShow: boolean
  pos: Vec2 // in viewport coords
  data: ContextMenuActionData
}
