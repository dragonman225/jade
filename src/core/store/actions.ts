import {
  BlockColor,
  BlockId,
  BlockInstance,
  Camera,
  ContextMenuActionData,
  PositionType,
  RelationId,
  Settings,
  Size,
  Vec2,
} from '../interfaces'

export enum Action {
  ConceptCreate = 'concept::create',
  ConceptWriteData = 'concept::writeData',
  BlockCreate = 'block::create',
  BlockRemove = 'block::remove',
  BlockCut = 'block::cut',
  BlockPaste = 'block::paste',
  BlockMoveStart = 'block::moveStart',
  BlockMove = 'block::move',
  BlockMoveEnd = 'block::moveEnd',
  BlockResizeDelta = 'block::resizeDelta',
  BlockSetMode = 'block::setMode',
  BlockSetColor = 'block::setColor',
  BlockSetSize = 'block::setSize',
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
  RelationRemove = 'relation::remove',
  NavigateBack = 'navigateBack',
  NavigateForward = 'navigateForward',
  BlocksRendered = 'blocksRendered',
  ContextMenuOpen = 'contextMenu::open',
  ContextMenuClose = 'contextMenu::close',
  SettingsSet = 'settings::set',
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

interface BlockCutAction {
  type: Action.BlockCut
}

interface BlockPasteAction {
  type: Action.BlockPaste
  data: {
    pointerInViewportCoords: Vec2
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

interface BlockResizeDeltaAction {
  type: Action.BlockResizeDelta
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

interface BlockSetColorAction {
  type: Action.BlockSetColor
  data: {
    id: BlockId
    color: BlockColor | undefined
  }
}

interface BlockSetSizeAction {
  type: Action.BlockSetSize
  data: {
    id: BlockId
    size: Size
  }
}

interface BlockSelectAction {
  type: Action.BlockSelect
  data: {
    blockIds: BlockId[]
  }
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
    focusBlockId?: BlockId
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

interface RelationRemoveAction {
  type: Action.RelationRemove
  data: {
    id: RelationId
  }
}

interface NavigateBackAction {
  type: Action.NavigateBack
}

interface NavigateForwardAction {
  type: Action.NavigateForward
}

interface BlocksRenderedAction {
  type: Action.BlocksRendered
}

interface ContextMenuOpenAction {
  type: Action.ContextMenuOpen
  data: ContextMenuActionData
}

interface ContextMenuCloseAction {
  type: Action.ContextMenuClose
}

interface SettingsSetAction {
  type: Action.SettingsSet
  data: Partial<Settings>
}

export type Actions =
  | ConceptCreateAction
  | ConceptWriteDataAction
  | BlockCreateAction
  | BlockRemoveAction
  | BlockCutAction
  | BlockPasteAction
  | BlockMoveStartAction
  | BlockMoveAction
  | BlockMoveEndAction
  | BlockResizeDeltaAction
  | BlockSetModeAction
  | BlockSetColorAction
  | BlockSetSizeAction
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
  | RelationRemoveAction
  | NavigateBackAction
  | NavigateForwardAction
  | BlocksRenderedAction
  | ContextMenuOpenAction
  | ContextMenuCloseAction
  | SettingsSetAction
