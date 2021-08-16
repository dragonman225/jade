import { BlockId, BlockInstance, Vec2 } from '../interfaces'

export enum Action {
  ConceptCreate = 'concept::create',
  ConceptWriteData = 'concept::writeData',
  BlockCreate = 'block::create',
  BlockRemove = 'block::remove',
  BlockRemoveSelected = 'block::removeSelected',
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
  SelectionBoxSetStart = 'selectionBox::setStart',
  SelectionBoxSetEnd = 'selectionBox::setEnd',
  SelectionBoxClear = 'selectionBox::clear',
  DebuggingToggle = 'debugging::toggle',
}

interface ConceptCreateAction {
  type: Action.ConceptCreate
  data: {
    position: Vec2
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
    id: string
  }
}

interface BlockRemoveSelectedAction {
  type: Action.BlockRemoveSelected
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

interface DebuggingToggleAction {
  type: Action.DebuggingToggle
}

export type Actions =
  | ConceptCreateAction
  | ConceptWriteDataAction
  | BlockCreateAction
  | BlockRemoveAction
  | BlockRemoveSelectedAction
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
  | SelectionBoxSetStartAction
  | SelectionBoxSetEndAction
  | SelectionBoxClearAction
  | DebuggingToggleAction
