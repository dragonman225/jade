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
} from './utils'
import { getElement } from './components/ElementPool'
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
    pointerInViewportCoords?: Vec2
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
  data: ReferenceId[]
}

interface SelectedBlocksRemoveAction {
  type: 'selection::remove'
  data: ReferenceId[]
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

interface BlockMoveStartAction {
  type: 'block::movestart'
  data: {
    id: ReferenceId
    pointerInViewportCoords: Vec2
  }
}

interface BlockMoveEndAction {
  type: 'block::moveend'
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
  | BlockMoveStartAction
  | BlockMoveEndAction
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
    pointerStartOffset: { x: 0, y: 0 },
    selectedBlockIds: [],
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
        const { pointerInViewportCoords } = action.data

        const {
          selectedBlockIds,
          blocks,
          viewingConcept,
          pointerStartOffset,
          camera,
        } = state

        const movingBlocks = blocks.filter(b =>
          selectedBlockIds.includes(b.refId)
        )

        const staticBlocks = blocks.filter(
          b => !selectedBlockIds.includes(b.refId)
        )

        const movingBlockRects = movingBlocks.map(b =>
          getElement(b.refId).getBoundingClientRect()
        )

        const currentSelectionBoundingBox = {
          top: Math.min(...movingBlockRects.map(r => r.top)),
          right: Math.max(...movingBlockRects.map(r => r.right)),
          bottom: Math.max(...movingBlockRects.map(r => r.bottom)),
          left: Math.min(...movingBlockRects.map(r => r.left)),
        }

        const selectionBoundingBoxSize = {
          w:
            (currentSelectionBoundingBox.right -
              currentSelectionBoundingBox.left) /
            camera.scale,
          h:
            (currentSelectionBoundingBox.bottom -
              currentSelectionBoundingBox.top) /
            camera.scale,
        }

        const currentSelectionBoundingBoxPos = {
          x: Math.min(...movingBlocks.map(b => b.pos.x)),
          y: Math.min(...movingBlocks.map(b => b.pos.y)),
        }

        const nextSelectionBoundingBoxPos = vecAdd(
          viewportCoordsToEnvCoords(pointerInViewportCoords, camera),
          pointerStartOffset
        )

        /**
         * To make `snapRange` the same value physically (i.e. in pixel),
         * we divide it by camera scale.
         */
        const snapRange = 12 / camera.scale
        const inRange = (a: number, b: number) => Math.abs(a - b) <= snapRange

        const movedBlocksMap: { [key: string]: Block } = {}
        const movement = vecSub(
          nextSelectionBoundingBoxPos,
          currentSelectionBoundingBoxPos
        )

        staticBlocks.forEach(sb => {
          const rect = getElement(sb.refId).getBoundingClientRect()
          const gap = 10
          const detectionZoneWidth = 35
          const detectionAreaPos = viewportCoordsToEnvCoords(
            {
              x: rect.left - detectionZoneWidth,
              y: rect.top - detectionZoneWidth,
            },
            camera
          )
          const detectionAreaSize = {
            w: (rect.right - rect.left + detectionZoneWidth * 2) / camera.scale,
            h: (rect.bottom - rect.top + detectionZoneWidth * 2) / camera.scale,
          }

          if (
            isBoxBoxIntersecting(
              nextSelectionBoundingBoxPos.x,
              nextSelectionBoundingBoxPos.y,
              selectionBoundingBoxSize.w,
              selectionBoundingBoxSize.h,
              detectionAreaPos.x,
              detectionAreaPos.y,
              detectionAreaSize.w,
              detectionAreaSize.h
            )
          ) {
            /** Left-Left */
            if (inRange(nextSelectionBoundingBoxPos.x, sb.pos.x)) {
              movement.x = sb.pos.x - currentSelectionBoundingBoxPos.x
            }

            /** Left-Right */
            if (
              inRange(
                nextSelectionBoundingBoxPos.x,
                sb.pos.x + rect.width / camera.scale + gap
              )
            ) {
              movement.x =
                sb.pos.x +
                rect.width / camera.scale -
                currentSelectionBoundingBoxPos.x +
                gap
            }

            /** Top-Top */
            if (inRange(nextSelectionBoundingBoxPos.y, sb.pos.y)) {
              movement.y = sb.pos.y - currentSelectionBoundingBoxPos.y
            }

            /** Top-Bottom */
            if (
              inRange(
                nextSelectionBoundingBoxPos.y,
                sb.pos.y + rect.height / camera.scale + gap
              )
            ) {
              movement.y =
                sb.pos.y +
                rect.height / camera.scale -
                currentSelectionBoundingBoxPos.y +
                gap
            }

            /** Right-Right */
            if (
              inRange(
                nextSelectionBoundingBoxPos.x + selectionBoundingBoxSize.w,
                sb.pos.x + rect.width / camera.scale
              )
            ) {
              movement.x =
                sb.pos.x +
                rect.width / camera.scale -
                (currentSelectionBoundingBoxPos.x + selectionBoundingBoxSize.w)
            }

            /** Right-Left */
            if (
              inRange(
                nextSelectionBoundingBoxPos.x + selectionBoundingBoxSize.w,
                sb.pos.x - gap
              )
            ) {
              movement.x =
                sb.pos.x -
                (currentSelectionBoundingBoxPos.x +
                  selectionBoundingBoxSize.w) -
                gap
            }

            /** Bottom-Bottom */
            if (
              inRange(
                nextSelectionBoundingBoxPos.y + selectionBoundingBoxSize.h,
                sb.pos.y + rect.height / camera.scale
              )
            ) {
              movement.y =
                sb.pos.y +
                rect.height / camera.scale -
                (currentSelectionBoundingBoxPos.y + selectionBoundingBoxSize.h)
            }

            /** Bottom-Top */
            if (
              inRange(
                nextSelectionBoundingBoxPos.y + selectionBoundingBoxSize.h,
                sb.pos.y - gap
              )
            ) {
              movement.y =
                sb.pos.y -
                (currentSelectionBoundingBoxPos.y +
                  selectionBoundingBoxSize.h) -
                gap
            }
          }
        })

        movingBlocks.forEach(mb => {
          movedBlocksMap[mb.refId] = {
            ...mb,
            pos: vecAdd(mb.pos, movement),
          }
        })

        const movedBlocks = Object.values(movedBlocksMap)

        const newRefs: Reference[] = movedBlocks.map(b => ({
          id: b.refId,
          pos: b.pos,
          posType: b.posType,
          size: b.size,
          to: b.concept.id,
        }))

        const newViewingConcept: Concept = {
          ...viewingConcept,
          references: viewingConcept.references
            .filter(r => !selectedBlockIds.includes(r.id))
            .concat(newRefs),
        }

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            .filter(b => !selectedBlockIds.includes(b.refId))
            .concat(movedBlocks),
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
          selectedBlockIds: state.selectedBlockIds.concat(
            /** Just add those that are not selected. */
            action.data.filter(
              c => !state.selectedBlockIds.find(sc => sc === c)
            )
          ),
        }
      }
      case 'selection::remove': {
        return {
          ...state,
          selectedBlockIds: state.selectedBlockIds.filter(
            sc => !action.data.find(c => c === sc)
          ),
        }
      }
      case 'selection::clear': {
        return {
          ...state,
          selectedBlockIds: [],
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
          selectedBlockIds: [],
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
        const selectedBlockIds = state.blocks
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
          selectedBlockIds,
          blocks: state.blocks.map(b => ({
            ...b,
            selected: selectedBlockIds.includes(b.refId),
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
      case 'block::movestart': {
        const { id, pointerInViewportCoords } = action.data
        const { blocks, selectedBlockIds: currSeletedBlockIds, camera } = state

        const selectedBlockIds = currSeletedBlockIds.length
          ? currSeletedBlockIds.includes(id)
            ? currSeletedBlockIds
            : [id]
          : [id]

        const movingBlocks = blocks.filter(b =>
          selectedBlockIds.includes(b.refId)
        )

        const boundingBoxPos: Vec2 = {
          x: Math.min(...movingBlocks.map(b => b.pos.x)),
          y: Math.min(...movingBlocks.map(b => b.pos.y)),
        }

        const pointerInEnvCoords = viewportCoordsToEnvCoords(
          pointerInViewportCoords,
          camera
        )

        return {
          ...state,
          blocks: blocks.map(b => ({
            ...b,
            selected: selectedBlockIds.includes(b.refId),
          })),
          selectedBlockIds,
          pointerStartOffset: vecSub(boundingBoxPos, pointerInEnvCoords),
        }
      }
      case 'block::moveend': {
        return {
          ...state,
          pointerStartOffset: { x: 0, y: 0 },
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
