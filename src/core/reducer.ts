import { v4 as uuidv4 } from 'uuid'
import { factoryRegistry } from '../factories'
import {
  BaseConceptData,
  Concept,
  ConceptId,
  DatabaseInterface,
  Reference,
  PositionType,
  State4,
  Stroke,
  Vec2,
  Block,
  Size,
  ReferenceId,
} from './interfaces'
import { viewportCoordsToEnvCoords, vecDiv, vecSub, vecAdd } from './lib/utils'
import initialConcepts from '../resources/initial-condition'

interface ConceptCreateAction {
  type: 'concept::create'
  data: {
    position: Vec2
  }
}

interface ConceptDataChangeAction {
  type: 'concept::datachange'
  data: {
    id: string
    type: string
    content: BaseConceptData
  }
}

interface ConceptDrawingChangeAction {
  type: 'concept::drawingchange'
  data: Stroke[]
}

interface RefCreateAction {
  type: 'ref::create'
  data: {
    id: string
    position: Vec2
  }
}

interface RefRemoveAction {
  type: 'ref::remove'
  data: {
    /** Link id. */
    id: string
  }
}

interface RefMoveAction {
  type: 'ref::move'
  data: {
    /** Link id. */
    id: string
    positionInEnvCoords?: Vec2
    movementInViewportCoords?: Vec2
  }
}

interface RefResizeAction {
  type: 'ref::resize'
  data: {
    /** Link id. */
    id: string
    sizeInEnvCoords?: Size
    movementInViewportCoords?: Vec2
  }
}

interface CameraMoveDeltaAction {
  type: 'cam::movedelta'
  data: Vec2
}

interface CameraScaleDeltaAction {
  type: 'cam::scaledelta'
  data: {
    focus: Vec2
    wheelDelta: number
  }
}

interface SelectionAddAction {
  type: 'selection::add'
  data: ConceptId[]
}

interface SelectionRemoveAction {
  type: 'selection::remove'
  data: ConceptId[]
}

interface SelectionClearAction {
  type: 'selection::clear'
}

interface ExpandAction {
  type: 'navigation::expand'
  data: {
    id: string
  }
}

interface BlockChangeAction {
  type: 'block::change'
  data: {
    id: ReferenceId
    changes: Partial<Block>
  }
}

interface DebuggingToggleAction {
  type: 'debugging::toggle'
}

export type Action =
  | ConceptCreateAction
  | ConceptDataChangeAction
  | ConceptDrawingChangeAction
  | RefCreateAction
  | RefRemoveAction
  | RefMoveAction
  | RefResizeAction
  | CameraMoveDeltaAction
  | CameraScaleDeltaAction
  | SelectionAddAction
  | SelectionRemoveAction
  | SelectionClearAction
  | ExpandAction
  | BlockChangeAction
  | DebuggingToggleAction

export function synthesizeView(
  viewingConcept: Concept,
  db: DatabaseInterface
): Block[] {
  const overlayConcept = db.getConcept('__tool_mask__')
  const overlayBlocks = overlayConcept.references.map(ref =>
    Reference.toBlock(ref, db)
  )
  const viewingBlocks = viewingConcept.references.map(ref =>
    Reference.toBlock(ref, db)
  )

  return overlayBlocks.concat(viewingBlocks)
}

export function loadAppState(db: DatabaseInterface): State4 {
  console.log('Loading app state.')

  if (!db.isValid()) {
    db.init(
      {
        debugging: false,
        homeConceptId: 'home',
        viewingConceptId: 'home',
      },
      initialConcepts
    )
  }

  const settings = db.getSettings()
  const viewingConcept = db.getConcept(settings.viewingConceptId)
  const blocks = synthesizeView(viewingConcept, db)

  return {
    debugging: settings.debugging,
    homeConceptId: settings.homeConceptId,
    viewingConcept,
    expandHistory: new Array(99).concat(viewingConcept.id) as (
      | ConceptId
      | undefined
    )[],
    camera: {
      focus: { x: 0, y: 0 },
      scale: 1,
    },
    selectedBlocks: [],
    blocks,
  }
}

export function createReducer(db: DatabaseInterface) {
  return function appStateReducer(state: State4, action: Action): State4 {
    // console.log(`reducer: "${action.type}"`, action)
    const defaultSize: Size = { w: 300, h: 'auto' }
    switch (action.type) {
      case 'concept::create': {
        const newConcept: Concept = {
          id: uuidv4(),
          summary: {
            type: factoryRegistry.getDefaultContentFactory().id,
            data: { initialized: false },
          },
          references: [],
          drawing: [],
        }
        const newLink: Reference = {
          id: uuidv4(),
          to: newConcept.id,
          posType: PositionType.Normal,
          pos: viewportCoordsToEnvCoords(action.data.position, state.camera),
          size: defaultSize,
        }
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          references: state.viewingConcept.references.concat([newLink]),
        }
        db.updateConcept(newViewingConcept)
        db.createConcept(newConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case 'ref::move': {
        const {
          id: refId,
          positionInEnvCoords: requestedPos,
          movementInViewportCoords,
        } = action.data

        // TODO: Not all concept belongs to viewingConcept.
        const oldRef = state.viewingConcept.references.find(r => r.id === refId)
        if (!oldRef) return { ...state }
        const oldPos = oldRef.pos
        const newPos = requestedPos
          ? requestedPos
          : movementInViewportCoords
          ? vecAdd(oldPos, vecDiv(movementInViewportCoords, state.camera.scale))
          : oldPos
        const newRef: Reference = { ...oldRef, pos: newPos }

        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          references: state.viewingConcept.references
            .filter(r => r.id !== refId)
            .concat(newRef),
        }

        db.updateConcept(newViewingConcept)

        const oldBlockIndex = state.blocks.findIndex(b => b.refId === refId)
        const newBlock: Block = { ...state.blocks[oldBlockIndex], pos: newPos }

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: state.blocks
            .slice(0, oldBlockIndex)
            .concat(state.blocks.slice(oldBlockIndex + 1))
            .concat(newBlock),
        }
      }
      case 'ref::resize': {
        const {
          id: refId,
          sizeInEnvCoords: requestedSize,
          movementInViewportCoords,
        } = action.data

        const oldSize = state.viewingConcept.references.find(
          l => l.id === refId
        ).size
        const newSize = requestedSize
          ? requestedSize
          : movementInViewportCoords
          ? {
              w:
                typeof oldSize.w === 'number'
                  ? oldSize.w + movementInViewportCoords.x / state.camera.scale
                  : oldSize.w,
              h:
                typeof oldSize.h === 'number'
                  ? oldSize.h + movementInViewportCoords.y / state.camera.scale
                  : oldSize.h,
            }
          : oldSize

        const newViewingConcept = {
          ...state.viewingConcept,
          references: state.viewingConcept.references.map(ref => {
            if (refId === ref.id) {
              return {
                ...ref,
                size: newSize,
              }
            } else {
              return ref
            }
          }),
        }

        db.updateConcept(newViewingConcept)

        const oldBlockIndex = state.blocks.findIndex(b => b.refId === refId)
        const newBlock: Block = {
          ...state.blocks[oldBlockIndex],
          size: newSize,
        }

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: state.blocks
            .slice(0, oldBlockIndex)
            .concat(state.blocks.slice(oldBlockIndex + 1))
            .concat(newBlock),
        }
      }
      case 'concept::datachange': {
        const newType = action.data.type
        const newData = action.data.content

        const concept = db.getConcept(action.data.id)

        db.updateConcept({
          ...concept,
          summary: {
            type: newType,
            data: newData,
          },
        })

        return {
          ...state,
          viewingConcept: db.getConcept(state.viewingConcept.id),
          blocks: synthesizeView(state.viewingConcept, db),
        }
      }
      case 'ref::remove': {
        // remove link only
        const linkId = action.data.id
        const newViewingConcept = {
          ...state.viewingConcept,
          references: state.viewingConcept.references.filter(
            link => linkId !== link.id
          ),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case 'cam::movedelta': {
        const delta = vecDiv(action.data, state.camera.scale)
        return {
          ...state,
          camera: {
            ...state.camera,
            focus: {
              x: state.camera.focus.x - delta.x,
              y: state.camera.focus.y - delta.y,
            },
          },
        }
      }
      case 'cam::scaledelta': {
        const minScale = 0.4
        const maxScale = 2
        /** Fibonacci scaling. */
        const ratio = Math.sqrt(1.618)
        /**
         * Calculate how many golden ratio (1.618) is going to be * or /.
         * Let's set 48px = 1 golden ratio.
         */
        const ratioExp = -action.data.wheelDelta / 48

        let nextScale = state.camera.scale * Math.pow(ratio, ratioExp)
        if (nextScale > maxScale) {
          nextScale = maxScale
        } else if (nextScale < minScale) {
          nextScale = minScale
        }

        let nextFocus = vecSub(
          viewportCoordsToEnvCoords(action.data.focus, state.camera),
          vecDiv(action.data.focus, nextScale)
        )
        if (nextScale === state.camera.scale) nextFocus = state.camera.focus

        return {
          ...state,
          camera: {
            ...state.camera,
            focus: nextFocus,
            scale: nextScale,
          },
        }
      }
      case 'selection::add': {
        return {
          ...state,
          selectedBlocks: state.selectedBlocks.concat(
            /** Just add those that are not selected. */
            action.data.filter(c => !state.selectedBlocks.find(sc => sc === c))
          ),
        }
      }
      case 'selection::remove': {
        return {
          ...state,
          selectedBlocks: state.selectedBlocks.filter(
            sc => !action.data.find(c => c === sc)
          ),
        }
      }
      case 'selection::clear': {
        return {
          ...state,
          selectedBlocks: [],
        }
      }
      case 'navigation::expand': {
        const toConceptId = action.data.id

        if (toConceptId === state.viewingConcept.id) {
          return { ...state }
        }

        db.saveSettings({
          debugging: state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: toConceptId,
        })
        const concept = db.getConcept(toConceptId)
        return {
          ...state,
          viewingConcept: concept,
          blocks: synthesizeView(concept, db),
          expandHistory: state.expandHistory.slice(1).concat(toConceptId),
        }
      }
      case 'ref::create': {
        const ref: Reference = {
          id: uuidv4(),
          to: action.data.id,
          posType: PositionType.Normal,
          pos: action.data.position,
          size: defaultSize,
        }
        const newViewingConcept = {
          ...state.viewingConcept,
          references: state.viewingConcept.references.concat([ref]),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case 'concept::drawingchange': {
        const concept = state.viewingConcept
        const conceptChanged = {
          ...concept,
          drawing: action.data,
        }
        db.updateConcept(conceptChanged)
        return {
          ...state,
          viewingConcept: conceptChanged,
        }
      }
      case 'block::change': {
        const { id, changes } = action.data
        const oldBlock = state.blocks.find(b => b.refId === id)
        const newBlock = { ...oldBlock, ...changes }

        return {
          ...state,
          blocks: state.blocks
            .filter(b => b.refId !== newBlock.refId)
            .concat(newBlock),
        }
      }
      case 'debugging::toggle': {
        db.saveSettings({
          debugging: !state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: state.viewingConcept.id,
        })
        return {
          ...state,
          debugging: !state.debugging,
        }
      }
    }
  }
}
