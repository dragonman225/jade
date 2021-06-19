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
  Camera,
} from './interfaces'
import {
  viewportCoordsToEnvCoords,
  vecDiv,
  vecSub,
  vecAdd,
  normalizeToBox,
  isBoxBoxIntersecting,
  vecReverseX,
  vecReverseY,
  vecReverseXY,
} from './utils'
import { initialConcepts } from '../resources/initial-concepts'

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

interface SelectedBlocksAddAction {
  type: 'selection::add'
  data: ConceptId[]
}

interface SelectedBlocksRemoveAction {
  type: 'selection::remove'
  data: ConceptId[]
}

interface SelectedBlocksClearAction {
  type: 'selection::clear'
}

interface SelectionBoxSetStartAction {
  type: 'selectionbox::setstart'
  data: Vec2
}

interface SelectionBoxSetEndAction {
  type: 'selectionbox::setend'
  data: Vec2
}

interface SelectionBoxClearAction {
  type: 'selectionbox::clear'
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
  | SelectedBlocksAddAction
  | SelectedBlocksRemoveAction
  | SelectedBlocksClearAction
  | SelectionBoxSetStartAction
  | SelectionBoxSetEndAction
  | SelectionBoxClearAction
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
    camera: viewingConcept.camera,
    selecting: false,
    selectionBoxStart: { x: 0, y: 0 },
    selectionBoxEnd: { x: 0, y: 0 },
    selectionBox: { x: 0, y: 0, w: 0, h: 0 },
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
          camera: {
            focus: { x: 0, y: 0 },
            scale: 1,
          },
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
        const { id: refId, movementInViewportCoords } = action.data
        const { selectedBlocks, blocks, viewingConcept } = state

        const blocksToUpdate = selectedBlocks.includes(refId)
          ? selectedBlocks
          : [refId]

        const newBlockAndRefTuples: [
          Block,
          Reference | undefined
        ][] = blocksToUpdate.map(blockId => {
          /** Update the block. */
          const block = blocks.find(b => b.refId === blockId)
          const ref = viewingConcept.references.find(r => r.id === blockId)

          const newPos = (() => {
            switch (block.posType) {
              case PositionType.PinnedTL: {
                return vecAdd(block.pos, movementInViewportCoords)
              }
              case PositionType.PinnedTR: {
                return vecAdd(block.pos, vecReverseX(movementInViewportCoords))
              }
              case PositionType.PinnedBL: {
                return vecAdd(block.pos, vecReverseY(movementInViewportCoords))
              }
              case PositionType.PinnedBR: {
                return vecAdd(block.pos, vecReverseXY(movementInViewportCoords))
              }
              default: {
                return vecAdd(
                  block.pos,
                  vecDiv(movementInViewportCoords, state.camera.scale)
                )
              }
            }
          })()

          return [
            {
              ...block,
              pos: newPos,
            },
            // TODO: Not all refs belongs to viewingConcept.
            ref
              ? {
                  ...ref,
                  pos: newPos,
                }
              : undefined,
          ]
        })

        const newBlocks = newBlockAndRefTuples.map(t => t[0])
        const newRefs = newBlockAndRefTuples.map(t => t[1]).filter(r => !!r)

        const newViewingConcept: Concept = {
          ...viewingConcept,
          references: viewingConcept.references
            .filter(r => !blocksToUpdate.includes(r.id))
            .concat(newRefs),
        }

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            .filter(b => !blocksToUpdate.includes(b.refId))
            .concat(newBlocks),
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

        const newCamera: Camera = {
          ...state.camera,
          focus: {
            x: state.camera.focus.x - delta.x,
            y: state.camera.focus.y - delta.y,
          },
        }
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          camera: newCamera,
        }

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          camera: newCamera,
        }
      }
      case 'cam::scaledelta': {
        const minScale = 0.2
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

        const newCamera: Camera = {
          ...state.camera,
          focus: nextFocus,
          scale: nextScale,
        }
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          camera: newCamera,
        }

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          camera: newCamera,
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
      case 'selectionbox::setstart': {
        const selectionBoxStart = viewportCoordsToEnvCoords(
          action.data,
          state.camera
        )

        return {
          ...state,
          selecting: true,
          selectionBoxStart,
          selectionBox: {
            ...selectionBoxStart,
            w: 0,
            h: 0,
          },
          /**
           * Clear old selection when new selection starts.
           *
           * Explanation: I want to clear selection on mousedown of primary
           * button with condition that event.target is the cameraEl
           * (equivalent to an empty area, note that mousedown bubbles).
           * This is the same as where "selectionbox::setstart" action is
           * fired.
           */
          selectedBlocks: [],
          blocks: state.blocks.map(b => ({ ...b, selected: false })),
        }
      }
      case 'selectionbox::setend': {
        const { selectionBoxStart } = state
        const selectionBoxEnd = viewportCoordsToEnvCoords(
          action.data,
          state.camera
        )
        const selectionBox = normalizeToBox(
          selectionBoxStart.x,
          selectionBoxStart.y,
          selectionBoxEnd.x,
          selectionBoxEnd.y
        )
        const selectedBlocks = state.blocks
          .map(b => {
            /** TODO: Resolve 'auto' to actual size. */
            const { size } = b
            return {
              ...b,
              size: {
                w: size.w === 'auto' ? 0 : size.w,
                h: size.h === 'auto' ? 0 : size.h,
              },
            }
          })
          .filter(
            /** Filter out pinned blocks. */
            b =>
              b.posType === PositionType.Normal &&
              isBoxBoxIntersecting(
                selectionBox.x,
                selectionBox.y,
                selectionBox.w,
                selectionBox.h,
                b.pos.x,
                b.pos.y,
                b.size.w,
                b.size.h
              )
          )
          .map(b => b.refId)

        return {
          ...state,
          selectionBoxEnd,
          selectionBox,
          selectedBlocks,
          blocks: state.blocks.map(b => ({
            ...b,
            selected: selectedBlocks.includes(b.refId),
          })),
        }
      }
      case 'selectionbox::clear': {
        return {
          ...state,
          selecting: false,
          selectionBoxStart: { x: 0, y: 0 },
          selectionBoxEnd: { x: 0, y: 0 },
          selectionBox: { x: 0, y: 0, w: 0, h: 0 },
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
          camera: concept.camera,
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
