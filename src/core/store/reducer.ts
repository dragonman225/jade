import {
  viewportCoordsToEnvCoords,
  vecDiv,
  vecSub,
  vecAdd,
  normalizeToBox,
  isBoxBoxIntersecting,
} from '../utils'
import {
  createBlock,
  createBlockInstance,
  getSelectedBlockIds,
  blockInstanceToBlock,
  updateBlockInstance,
} from '../utils/block'
import { createConcept, updateConcept } from '../utils/concept'
import { generateGuidelinesFromRects, RectSide, snapValue } from '../utils/snap'
import { getElement } from '../components/ElementPool'
import { Action, Actions } from './actions'
import {
  Concept,
  ConceptId,
  DatabaseInterface,
  Block,
  PositionType,
  AppState,
  Vec2,
  BlockInstance,
  Size,
  Camera,
  FactoryRegistry,
} from '../interfaces'

export function synthesizeView(
  viewingConcept: Concept,
  db: DatabaseInterface,
  existingBlockInstances?: BlockInstance[]
): BlockInstance[] {
  function blockToBlockInstance(block: Block) {
    if (!existingBlockInstances)
      return createBlockInstance(block, db.getConcept(block.to))

    const existingBlockInstance = existingBlockInstances.find(
      b => b.id === block.id
    )
    if (existingBlockInstance) {
      existingBlockInstance.concept = db.getConcept(block.to)
      existingBlockInstance.posType = block.posType
      existingBlockInstance.pos = block.pos
      existingBlockInstance.size = block.size
      existingBlockInstance.lastEditedTime = block.lastEditedTime
      return existingBlockInstance
    } else {
      return createBlockInstance(block, db.getConcept(block.to))
    }
  }

  const overlayConcept = db.getConcept('__tool_mask__')
  const overlayBlocks = overlayConcept.references.map(blockToBlockInstance)
  const viewingBlocks = viewingConcept.references.map(blockToBlockInstance)

  return overlayBlocks.concat(viewingBlocks)
}

export function loadAppState(db: DatabaseInterface): AppState {
  console.log('core/store/reducer: Loading app state')

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

export function createReducer(
  db: DatabaseInterface,
  factoryRegistry: FactoryRegistry
): (state: AppState, action: Actions) => AppState {
  const defaultSize: Size = { w: 300, h: 'auto' }

  let cursorBlockId = ''
  let cursorRectSize: { w: number; h: number } = { w: 0, h: 0 }

  return function appStateReducer(state: AppState, action: Actions): AppState {
    // console.log(`core/store/reducer: "${action.type}"`, action)

    switch (action.type) {
      case Action.ConceptCreate: {
        const defaultType = factoryRegistry.getDefaultContentFactory().id
        const newConcept = createConcept(defaultType)
        const newBlock = createBlock({
          to: newConcept.id,
          posType: PositionType.Normal,
          pos: viewportCoordsToEnvCoords(action.data.position, state.camera),
          size: defaultSize,
        })
        const newBlockInstance = createBlockInstance(newBlock, newConcept)
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.concat(newBlock),
        })

        db.createConcept(newConcept)
        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: state.blocks.concat(newBlockInstance),
        }
      }
      case Action.ConceptWriteData: {
        const newType = action.data.type
        const newData = action.data.content
        const concept = db.getConcept(action.data.id)
        const newConcept = updateConcept(concept, {
          summary: {
            type: newType,
            data: newData,
          },
        })

        db.updateConcept(newConcept)

        return {
          ...state,
          viewingConcept: db.getConcept(state.viewingConcept.id),
          blocks: synthesizeView(state.viewingConcept, db, state.blocks),
        }
      }
      case Action.BlockCreate: {
        const newBlock = createBlock({
          to: action.data.id,
          posType: PositionType.Normal,
          pos: action.data.position,
          size: defaultSize,
        })
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.concat([newBlock]),
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case Action.BlockRemove: {
        const blockId = action.data.id
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.filter(
            b => blockId !== b.id
          ),
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case Action.BlockRemoveSelected: {
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.filter(
            b => !state.selectedBlockIds.find(sbId => sbId === b.id)
          ),
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: synthesizeView(newViewingConcept, db),
          selectedBlockIds: [],
        }
      }
      case Action.BlockMoveStart: {
        const { id, pointerInViewportCoords } = action.data
        const { blocks, selectedBlockIds: currSeletedBlockIds, camera } = state

        const selectedBlockIds = currSeletedBlockIds.length
          ? currSeletedBlockIds.includes(id)
            ? currSeletedBlockIds
            : [id]
          : [id]

        const movingBlocks = blocks.filter(b => selectedBlockIds.includes(b.id))

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
          blocks: blocks.map(b =>
            updateBlockInstance(b, {
              selected: selectedBlockIds.includes(b.id),
            })
          ),
          selectedBlockIds,
          pointerStartOffset: vecSub(boundingBoxPos, pointerInEnvCoords),
        }
      }
      case Action.BlockMove: {
        const { pointerInViewportCoords } = action.data

        const {
          selectedBlockIds,
          blocks,
          viewingConcept,
          pointerStartOffset,
          camera,
        } = state

        const movingBlocks = blocks.filter(b => selectedBlockIds.includes(b.id))

        const staticBlocks = blocks
          .filter(b => b.posType === PositionType.Normal)
          .filter(b => !selectedBlockIds.includes(b.id))

        const movingBlockRects = movingBlocks.map(b =>
          getElement(b.id).getBoundingClientRect()
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

        const movedBlocksMap: { [key: string]: BlockInstance } = {}
        const movement = vecSub(
          nextSelectionBoundingBoxPos,
          currentSelectionBoundingBoxPos
        )

        staticBlocks.forEach(sb => {
          const rect = getElement(sb.id).getBoundingClientRect()
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
          movedBlocksMap[mb.id] = {
            ...mb,
            pos: vecAdd(mb.pos, movement),
          }
        })

        const movedBlocks = Object.values(movedBlocksMap)

        const newBlocks: Block[] = movedBlocks.map(blockInstanceToBlock)

        const newViewingConcept = updateConcept(viewingConcept, {
          references: viewingConcept.references
            .filter(r => !selectedBlockIds.includes(r.id))
            .concat(newBlocks),
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            .filter(b => !selectedBlockIds.includes(b.id))
            .concat(movedBlocks),
        }
      }
      case Action.BlockMoveEnd: {
        return {
          ...state,
          pointerStartOffset: { x: 0, y: 0 },
        }
      }
      case Action.BlockResize: {
        const { id, movementInViewportCoords } = action.data
        const { camera, blocks } = state

        const block = state.blocks.find(b => b.id === id)
        const blockViewportRect = getElement(id).getBoundingClientRect()
        const oldSize = block.size

        cursorRectSize =
          cursorBlockId !== id
            ? /** The first resize action of a block. */
              {
                w:
                  typeof oldSize.w === 'number'
                    ? oldSize.w + movementInViewportCoords.x / camera.scale
                    : blockViewportRect.width / camera.scale,
                h:
                  typeof oldSize.h === 'number'
                    ? oldSize.h + movementInViewportCoords.y / camera.scale
                    : blockViewportRect.height / camera.scale,
              }
            : {
                w:
                  typeof cursorRectSize.w === 'number'
                    ? cursorRectSize.w +
                      movementInViewportCoords.x / camera.scale
                    : cursorRectSize.w,
                h:
                  typeof cursorRectSize.h === 'number'
                    ? cursorRectSize.h +
                      movementInViewportCoords.y / camera.scale
                    : cursorRectSize.h,
              }
        cursorBlockId = id

        const cursorRect = {
          ...block.pos,
          ...cursorRectSize,
        }

        const targetRects = blocks
          .filter(b => b.id !== id && b.posType === PositionType.Normal)
          .map(b => {
            const viewportRect = getElement(b.id).getBoundingClientRect()
            return {
              ...b.pos,
              w:
                typeof b.size.w === 'number'
                  ? b.size.w
                  : viewportRect.width / camera.scale,
              h:
                typeof b.size.h === 'number'
                  ? b.size.h
                  : viewportRect.height / camera.scale,
            }
          })

        const generationTolerance = 36 / camera.scale
        const gap = 10

        const {
          horizontalGuidelines,
          verticalGuidelines,
        } = generateGuidelinesFromRects(
          cursorRect,
          targetRects,
          generationTolerance
        )

        const snapTolerance = 12 / camera.scale

        /** Snap bottom and right. */
        const bottom = snapValue(
          cursorRect.y + cursorRect.h,
          horizontalGuidelines,
          snapTolerance
        )

        const right = snapValue(
          cursorRect.x + cursorRect.w,
          verticalGuidelines,
          snapTolerance
        )

        /**
         * Calculate height and width from snapped bottom and right,
         * considering the gap.
         */
        const height = bottom.guideline
          ? bottom.guideline.fromSide === RectSide.Top
            ? bottom.value - gap - cursorRect.y // cursorRect's bottom snaps targetRect's top.
            : bottom.value - cursorRect.y
          : bottom.value - cursorRect.y

        const width = right.guideline
          ? right.guideline.fromSide === RectSide.Left
            ? right.value - gap - cursorRect.x // cursorRect's right snaps targetRect's left.
            : right.value - cursorRect.x
          : right.value - cursorRect.x

        /** Ignore snap result if size is "auto". */
        const newSize = {
          w: typeof oldSize.w === 'number' ? width : oldSize.w,
          h: typeof oldSize.h === 'number' ? height : oldSize.h,
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.map(ref => {
            if (id === ref.id) {
              return {
                ...ref,
                size: newSize,
              }
            } else {
              return ref
            }
          }),
        })

        db.updateConcept(newViewingConcept)

        const oldBlockIndex = blocks.findIndex(b => b.id === id)
        const newBlock = updateBlockInstance(blocks[oldBlockIndex], {
          size: newSize,
        })

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            .slice(0, oldBlockIndex)
            .concat(blocks.slice(oldBlockIndex + 1))
            .concat(newBlock),
        }
      }
      case Action.BlockSetMode: {
        const { id, mode } = action.data
        const oldBlock = state.blocks.find(b => b.id === id)
        const newBlock = { ...oldBlock, mode }

        return {
          ...state,
          blocks: state.blocks
            .filter(b => b.id !== newBlock.id)
            .concat(newBlock),
        }
      }
      case Action.BlockSelect: {
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
      case Action.BlockDeselect: {
        return {
          ...state,
          selectedBlockIds: state.selectedBlockIds.filter(
            sc => !action.data.find(c => c === sc)
          ),
        }
      }
      case Action.BlockDeselectAll: {
        return {
          ...state,
          selectedBlockIds: [],
        }
      }
      case Action.BlockOpenAsCanvas: {
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
      case Action.SelectionBoxSetStart: {
        const selectionBoxStart = viewportCoordsToEnvCoords(
          action.data,
          state.camera
        )

        return {
          ...state,
          selecting: true,
          selectionBoxStart,
          selectionBoxEnd: selectionBoxStart,
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
          blocks: state.blocks.map(b =>
            updateBlockInstance(b, { selected: false })
          ),
        }
      }
      case Action.SelectionBoxSetEnd: {
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
        const selectedBlockIds = getSelectedBlockIds(state.blocks, selectionBox)
        const newBlockInstances = state.blocks.map(b =>
          updateBlockInstance(b, {
            selected: selectedBlockIds.includes(b.id),
          })
        )

        return {
          ...state,
          selectionBoxEnd,
          selectionBox,
          selectedBlockIds,
          blocks: newBlockInstances,
        }
      }
      case Action.SelectionBoxClear: {
        return {
          ...state,
          selecting: false,
          selectionBoxStart: { x: 0, y: 0 },
          selectionBoxEnd: { x: 0, y: 0 },
          selectionBox: { x: 0, y: 0, w: 0, h: 0 },
        }
      }
      case Action.CameraMoveDelta: {
        const delta = vecDiv(action.data, state.camera.scale)

        const newCamera: Camera = {
          ...state.camera,
          focus: {
            x: state.camera.focus.x - delta.x,
            y: state.camera.focus.y - delta.y,
          },
        }
        const newViewingConcept = updateConcept(state.viewingConcept, {
          camera: newCamera,
        })

        db.updateConcept(newViewingConcept)

        /** Also update selectionBox if being selecting. */
        const { selectionBoxStart, selecting } = state
        if (selecting) {
          const selectionBoxEnd = vecSub(state.selectionBoxEnd, delta)
          const selectionBox = normalizeToBox(
            selectionBoxStart.x,
            selectionBoxStart.y,
            selectionBoxEnd.x,
            selectionBoxEnd.y
          )
          const selectedBlockIds = getSelectedBlockIds(
            state.blocks,
            selectionBox
          )
          const blocks = state.blocks.map(b =>
            updateBlockInstance(b, {
              selected: selectedBlockIds.includes(b.id),
            })
          )

          return {
            ...state,
            viewingConcept: newViewingConcept,
            camera: newCamera,
            selectionBoxEnd,
            selectionBox,
            selectedBlockIds,
            blocks,
          }
        }

        return {
          ...state,
          viewingConcept: newViewingConcept,
          camera: newCamera,
        }
      }
      case Action.CameraScaleDelta: {
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
        const newViewingConcept = updateConcept(state.viewingConcept, {
          camera: newCamera,
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          camera: newCamera,
        }
      }
      case Action.DebuggingToggle: {
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
