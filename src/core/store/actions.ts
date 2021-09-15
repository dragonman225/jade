import {
  BlockId,
  BlockInstance,
  Camera,
  PositionType,
  Vec2,
} from '../interfaces'

export enum Action {
  ConceptCreate = 'concept::create',
  ConceptWriteData = 'concept::writeData',
  BlockCreate = 'block::create',
  BlockRemove = 'block::remove',
  BlockMoveStart = 'block::moveStart',
  BlockMove = 'block::move',
  BlockMoveEnd = 'block::moveEnd',
  BlockResize = 'block::resize',
  BlockSetMode = 'block::setMode',
  BlockSelect = 'block::select',
  BlockDeselect = 'block::deselect',
  BlockDeselectAll = 'block::deselectAll',
  BlockOpenAsCanvas = 'block::openAsCanvas',
  CameraMoveDelta = 'camera::moveDelta',
  CameraScaleDelta = 'camera::scaleDelta',
  CameraSetValue = 'camera::setValue',
  SelectionBoxSetStart = 'selectionBox::setStart',
  SelectionBoxSetEnd = 'selectionBox::setEnd',
  SelectionBoxClear = 'selectionBox::clear',
  RelationDrawStart = 'relation::drawStart',
  RelationDrawMove = 'relation::drawMove',
  RelationDrawEnd = 'relation::drawEnd',
  DebuggingToggle = 'debugging::toggle',
  /** Now only for undo `BlockOpenAsCanvas`, but will evolve to real undo. */
  Undo = 'undo',
  BlocksRendered = 'blocksRendered',
  ContextMenuOpen = 'contextMenu::open',
  ContextMenuClose = 'contextMenu::close',
}

export enum ConceptCreatePositionIntent {
  ExactAt = 'exactAt',
  Below = 'below',
  Above = 'above',
  LeftOf = 'leftOf',
  RightOf = 'rightOf',
}

interface ConceptCreateAction {
  type: Action.ConceptCreate
  data:
    | {
        posType: PositionType
        intent: ConceptCreatePositionIntent.ExactAt
        pointerInViewportCoords: Vec2
      }
    | {
        posType: PositionType
        intent:
          | ConceptCreatePositionIntent.Below
          | ConceptCreatePositionIntent.Above
          | ConceptCreatePositionIntent.LeftOf
          | ConceptCreatePositionIntent.RightOf
        blockId: BlockId
      }
}

interface ConceptWriteDataAction {
  type: Action.ConceptWriteData
  data: {
    id: string
    type: string
    content: unknown
  }
}

interface BlockCreateAction {
  type: Action.BlockCreate
  data: {
    id: string
    position: Vec2
  }
}

interface BlockRemoveAction {
  type: Action.BlockRemove
  data: {
    id?: string
  }
}

interface BlockMoveStartAction {
  type: Action.BlockMoveStart
  data: {
    id: BlockId
    pointerInViewportCoords: Vec2
  }
}

interface BlockMoveAction {
  type: Action.BlockMove
  data: {
    id: string
    pointerInViewportCoords: Vec2
  }
}

interface BlockMoveEndAction {
  type: Action.BlockMoveEnd
}

interface BlockResizeAction {
  type: Action.BlockResize
  data: {
    id: string
    movementInViewportCoords: Vec2
  }
}

interface BlockSetModeAction {
  type: Action.BlockSetMode
  data: {
    id: BlockId
    mode: BlockInstance['mode']
  }
}

interface BlockSelectAction {
  type: Action.BlockSelect
  data: BlockId[]
}

interface BlockDeselectAction {
  type: Action.BlockDeselect
  data: BlockId[]
}

interface BlockDeselectAllAction {
  type: Action.BlockDeselectAll
}

interface BlockOpenAsCanvasAction {
  type: Action.BlockOpenAsCanvas
  data: {
    id: string
  }
}

interface CameraMoveDeltaAction {
  type: Action.CameraMoveDelta
  data: Vec2
}

interface CameraScaleDeltaAction {
  type: Action.CameraScaleDelta
  data: {
    focus: Vec2
    wheelDelta: number
  }
}

interface CameraSetValueAction {
  type: Action.CameraSetValue
  data: Partial<Camera>
}

interface SelectionBoxSetStartAction {
  type: Action.SelectionBoxSetStart
  data: Vec2
}

interface SelectionBoxSetEndAction {
  type: Action.SelectionBoxSetEnd
  data: Vec2
}

interface SelectionBoxClearAction {
  type: Action.SelectionBoxClear
}

interface RelationDrawStartAction {
  type: Action.RelationDrawStart
  data: {
    id: BlockId
    pointerInViewportCoords: Vec2
  }
}

interface RelationDrawMoveAction {
  type: Action.RelationDrawMove
  data: {
    id: BlockId
    pointerInViewportCoords: Vec2
  }
}

interface RelationDrawEndAction {
  type: Action.RelationDrawEnd
  data: {
    id: BlockId
    pointerInViewportCoords: Vec2
  }
}

interface DebuggingToggleAction {
  type: Action.DebuggingToggle
}

interface UndoAction {
  type: Action.Undo
}

interface BlocksRenderedAction {
  type: Action.BlocksRendered
}

interface ContextMenuOpenAction {
  type: Action.ContextMenuOpen
  data: {
    pointerInViewportCoords: Vec2
  }
}

interface ContextMenuCloseAction {
  type: Action.ContextMenuClose
}

export type Actions =
  | ConceptCreateAction
  | ConceptWriteDataAction
  | BlockCreateAction
  | BlockRemoveAction
  | BlockMoveStartAction
  | BlockMoveAction
  | BlockMoveEndAction
  | BlockResizeAction
  | BlockSetModeAction
  | BlockSelectAction
  | BlockDeselectAction
  | BlockDeselectAllAction
  | BlockOpenAsCanvasAction
  | CameraMoveDeltaAction
  | CameraScaleDeltaAction
  | CameraSetValueAction
  | SelectionBoxSetStartAction
  | SelectionBoxSetEndAction
  | SelectionBoxClearAction
  | RelationDrawStartAction
  | RelationDrawMoveAction
  | RelationDrawEndAction
  | DebuggingToggleAction
  | UndoAction
  | BlocksRenderedAction
  | ContextMenuOpenAction
  | ContextMenuCloseAction
