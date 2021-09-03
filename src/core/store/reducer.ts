import {
  viewportCoordsToEnvCoords,
  vecDiv,
  vecSub,
  vecAdd,
  normalizeToBox,
  isBoxBoxIntersecting,
  isPointInRect,
  getBoundingBox,
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
import {
  clearElementRectMap,
  deleteElementRects,
  getBlockRect,
} from '../utils/element-pool'
import { Action, Actions } from './actions'
import {
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
  TypedConcept,
  BlockId,
} from '../interfaces'

export function synthesizeView(
  viewingConcept: TypedConcept<unknown>,
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
    pointerOffsetInSelectionBoundingBox: { x: 0, y: 0 },
    selectedBlockIds: [],
    blocks,
  }
}

export function createReducer(
  db: DatabaseInterface,
  factoryRegistry: FactoryRegistry
): (state: AppState, action: Actions) => AppState {
  const defaultSize: Size = { w: 300, h: 'auto' }

  /**
   * "Cursor Block" is a block that fires actions when multiple blocks are
   * selected.
   */
  let prevCursorBlockId = ''
  let cursorBlockNewSize: { w: number; h: number } = { w: 0, h: 0 }
  /** A block that the pointer is on. */
  let pointerOverBlock: BlockInstance = undefined

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

        deleteElementRects([blockId])

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

        deleteElementRects(state.selectedBlockIds)

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

        if (blocks.find(b => id === b.id)?.posType !== PositionType.Normal) {
          console.warn(
            'reducer: No support for moving non-normal positioned blocks.'
          )
          return state
        }

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
          pointerOffsetInSelectionBoundingBox: vecSub(
            pointerInEnvCoords,
            boundingBoxPos
          ),
        }
      }
      case Action.BlockMove: {
        const { id, pointerInViewportCoords } = action.data

        const {
          selectedBlockIds,
          blocks,
          viewingConcept,
          pointerOffsetInSelectionBoundingBox: pointerOffsetInBoundingBox,
          camera,
        } = state

        if (blocks.find(b => id === b.id)?.posType !== PositionType.Normal) {
          console.warn(
            'reducer: No support for moving non-normal positioned blocks.'
          )
          return state
        }

        /** Blocks to move are those selected. */
        const movingBlocks = blocks.filter(b => selectedBlockIds.includes(b.id))
        /** Below are in viewport coordinates. */
        const movingBlockRects = movingBlocks.map(b => getBlockRect(b.id))
        const movingBlocksBoundingBox = getBoundingBox(movingBlockRects)
        /** Below are in environment coordinates. */
        const movingBlocksBoundingBoxSize = {
          w:
            (movingBlocksBoundingBox.right - movingBlocksBoundingBox.left) /
            camera.scale,
          h:
            (movingBlocksBoundingBox.bottom - movingBlocksBoundingBox.top) /
            camera.scale,
        }
        const movingBlocksBoundingBoxPos = {
          x: Math.min(...movingBlocks.map(b => b.pos.x)),
          y: Math.min(...movingBlocks.map(b => b.pos.y)),
        }
        const pointerInEnvCoords = viewportCoordsToEnvCoords(
          pointerInViewportCoords,
          camera
        )
        const movingBlocksBoundingBoxNextPos = vecSub(
          pointerInEnvCoords,
          pointerOffsetInBoundingBox
        )

        /**
         * To make `snapRange` the same value physically (i.e. in pixel),
         * we divide it by camera scale.
         */
        const snapRange = 12 / camera.scale
        const inRange = (a: number, b: number) => Math.abs(a - b) <= snapRange

        const movedBlocksMap: { [key: string]: BlockInstance } = {}
        const movement = vecSub(
          movingBlocksBoundingBoxNextPos,
          movingBlocksBoundingBoxPos
        )

        const staticBlocks = blocks
          .filter(b => b.posType === PositionType.Normal)
          .filter(b => !selectedBlockIds.includes(b.id))
        staticBlocks.forEach(sb => {
          const rect = getBlockRect(sb.id)
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
              movingBlocksBoundingBoxNextPos.x,
              movingBlocksBoundingBoxNextPos.y,
              movingBlocksBoundingBoxSize.w,
              movingBlocksBoundingBoxSize.h,
              detectionAreaPos.x,
              detectionAreaPos.y,
              detectionAreaSize.w,
              detectionAreaSize.h
            )
          ) {
            /** Left-Left */
            if (inRange(movingBlocksBoundingBoxNextPos.x, sb.pos.x)) {
              movement.x = sb.pos.x - movingBlocksBoundingBoxPos.x
            }

            /** Left-Right */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.x,
                sb.pos.x + rect.width / camera.scale + gap
              )
            ) {
              movement.x =
                sb.pos.x +
                rect.width / camera.scale -
                movingBlocksBoundingBoxPos.x +
                gap
            }

            /** Top-Top */
            if (inRange(movingBlocksBoundingBoxNextPos.y, sb.pos.y)) {
              movement.y = sb.pos.y - movingBlocksBoundingBoxPos.y
            }

            /** Top-Bottom */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.y,
                sb.pos.y + rect.height / camera.scale + gap
              )
            ) {
              movement.y =
                sb.pos.y +
                rect.height / camera.scale -
                movingBlocksBoundingBoxPos.y +
                gap
            }

            /** Right-Right */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.x +
                  movingBlocksBoundingBoxSize.w,
                sb.pos.x + rect.width / camera.scale
              )
            ) {
              movement.x =
                sb.pos.x +
                rect.width / camera.scale -
                (movingBlocksBoundingBoxPos.x + movingBlocksBoundingBoxSize.w)
            }

            /** Right-Left */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.x +
                  movingBlocksBoundingBoxSize.w,
                sb.pos.x - gap
              )
            ) {
              movement.x =
                sb.pos.x -
                (movingBlocksBoundingBoxPos.x + movingBlocksBoundingBoxSize.w) -
                gap
            }

            /** Bottom-Bottom */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.y +
                  movingBlocksBoundingBoxSize.h,
                sb.pos.y + rect.height / camera.scale
              )
            ) {
              movement.y =
                sb.pos.y +
                rect.height / camera.scale -
                (movingBlocksBoundingBoxPos.y + movingBlocksBoundingBoxSize.h)
            }

            /** Bottom-Top */
            if (
              inRange(
                movingBlocksBoundingBoxNextPos.y +
                  movingBlocksBoundingBoxSize.h,
                sb.pos.y - gap
              )
            ) {
              movement.y =
                sb.pos.y -
                (movingBlocksBoundingBoxPos.y + movingBlocksBoundingBoxSize.h) -
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

        pointerOverBlock = (() => {
          for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i]
            if (
              /** It makes no sense to over itself. */
              block.id !== id &&
              isPointInRect(pointerInViewportCoords, getBlockRect(block.id))
            )
              return block
          }
          return undefined
        })()

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            .filter(b => !selectedBlockIds.includes(b.id))
            .concat(movedBlocks)
            .map(b =>
              updateBlockInstance(b, {
                highlighted: b.id === (pointerOverBlock && pointerOverBlock.id),
              })
            ),
        }
      }
      case Action.BlockMoveEnd: {
        if (pointerOverBlock) {
          /**
           * When a move is end, if the pointer is over a *Block*, we move
           * the selected *Block*s into the *Concept* the *Block*
           * represents.
           */
          const { viewingConcept, selectedBlockIds, blocks } = state
          const movingBlocks = blocks.filter(b =>
            selectedBlockIds.includes(b.id)
          )

          /**
           * We want to keep the relative position of the moving blocks
           * after moving them.
           */
          const topLeftMostMovingBlock = movingBlocks.reduce((pv, cv) => {
            if (cv.pos.x <= pv.pos.x && cv.pos.y <= pv.pos.y) return cv
            else return pv
          }, movingBlocks[0])

          const targetConcept = db.getConcept(pointerOverBlock.concept.id)

          /**
           * The top-right corner of the bounding box of all blocks in
           * targetConcept.
           */
          const topRightOfBoundingBoxOfBlocksInTargetConcept = targetConcept.references.reduce(
            (pos, r) => {
              const rightX = r.pos.x + (r.size.w === 'auto' ? 0 : r.size.w)
              if (rightX > pos.x) {
                pos.x = rightX
              }
              if (r.pos.y < pos.y) {
                pos.y = r.pos.y
              }
              return pos
            },
            { x: -Infinity, y: -Infinity }
          )

          /** Handle the case where targetConcept.references is []. */
          const newPosOfTopLeftMostMovingBlock = vecAdd(
            {
              x:
                topRightOfBoundingBoxOfBlocksInTargetConcept.x === -Infinity
                  ? 100
                  : topRightOfBoundingBoxOfBlocksInTargetConcept.x,
              y:
                topRightOfBoundingBoxOfBlocksInTargetConcept.y === -Infinity
                  ? 100
                  : topRightOfBoundingBoxOfBlocksInTargetConcept.y,
            },
            { x: 100, y: 0 }
          )

          /** The vector each moving block should move. */
          const vectorToMove = vecSub(
            newPosOfTopLeftMostMovingBlock,
            topLeftMostMovingBlock.pos
          )

          const newViewingConcept = updateConcept(viewingConcept, {
            references: viewingConcept.references.filter(
              r => !selectedBlockIds.includes(r.id)
            ),
          })

          const newTargetConcept = updateConcept(targetConcept, {
            references: targetConcept.references.concat(
              viewingConcept.references
                .filter(r => selectedBlockIds.includes(r.id))
                .map(r => ({
                  ...r,
                  pos: vecAdd(r.pos, vectorToMove),
                }))
            ),
          })

          db.updateConcept(newViewingConcept)
          db.updateConcept(newTargetConcept)

          return {
            ...state,
            viewingConcept: newViewingConcept,
            pointerOffsetInSelectionBoundingBox: { x: 0, y: 0 },
            blocks: blocks
              .filter(b => !movingBlocks.includes(b))
              .map(b => ({
                ...b,
                concept:
                  b.concept.id === targetConcept.id
                    ? newTargetConcept
                    : b.concept,
                highlighted: false,
              })),
          }
        }

        return {
          ...state,
          pointerOffsetInSelectionBoundingBox: { x: 0, y: 0 },
          blocks: state.blocks.map(b =>
            updateBlockInstance(b, { highlighted: false })
          ),
        }
      }
      case Action.BlockResize: {
        const { id, movementInViewportCoords } = action.data
        const { camera, blocks, selectedBlockIds } = state

        const cursorBlock = state.blocks.find(b => b.id === id)
        const cursorBlockRectInViewportCoords = getBlockRect(id)
        const cursorBlockOldSize = cursorBlock.size

        cursorBlockNewSize =
          prevCursorBlockId !== id
            ? /** The first resize action of a block. */
              {
                w:
                  typeof cursorBlockOldSize.w === 'number'
                    ? cursorBlockOldSize.w +
                      movementInViewportCoords.x / camera.scale
                    : cursorBlockRectInViewportCoords.width / camera.scale,
                h:
                  typeof cursorBlockOldSize.h === 'number'
                    ? cursorBlockOldSize.h +
                      movementInViewportCoords.y / camera.scale
                    : cursorBlockRectInViewportCoords.height / camera.scale,
              }
            : {
                w:
                  typeof cursorBlockNewSize.w === 'number'
                    ? cursorBlockNewSize.w +
                      movementInViewportCoords.x / camera.scale
                    : cursorBlockNewSize.w,
                h:
                  typeof cursorBlockNewSize.h === 'number'
                    ? cursorBlockNewSize.h +
                      movementInViewportCoords.y / camera.scale
                    : cursorBlockNewSize.h,
              }
        prevCursorBlockId = id

        const cursorBlockRect = {
          ...cursorBlock.pos,
          ...cursorBlockNewSize,
        }

        /**
         * A block should be resized if:
         * 1. It's the source of this action, no matter if it's selected.
         * 2. It's selected, and the source of this action is selected.
         */
        const shouldResize = (blockId: BlockId): boolean => {
          return cursorBlock.selected
            ? selectedBlockIds.includes(blockId)
            : blockId === cursorBlock.id
        }

        const guidelineRects = blocks
          .filter(
            /** Not cursor block, not selected, position normal. */
            b => !shouldResize(b.id)
          )
          .map(b => {
            const viewportRect = getBlockRect(b.id)
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
          cursorBlockRect,
          guidelineRects,
          generationTolerance
        )

        const snapTolerance = 12 / camera.scale

        /** Snap bottom and right. */
        const bottom = snapValue(
          cursorBlockRect.y + cursorBlockRect.h,
          horizontalGuidelines,
          snapTolerance
        )

        const right = snapValue(
          cursorBlockRect.x + cursorBlockRect.w,
          verticalGuidelines,
          snapTolerance
        )

        /**
         * Calculate height and width from snapped bottom and right,
         * considering the gap.
         */
        const height = bottom.guideline
          ? bottom.guideline.fromSide === RectSide.Top
            ? bottom.value - gap - cursorBlockRect.y // cursorRect's bottom snaps targetRect's top.
            : bottom.value - cursorBlockRect.y
          : bottom.value - cursorBlockRect.y

        const width = right.guideline
          ? right.guideline.fromSide === RectSide.Left
            ? right.value - gap - cursorBlockRect.x // cursorRect's right snaps targetRect's left.
            : right.value - cursorBlockRect.x
          : right.value - cursorBlockRect.x

        /** Ignore snap result if size is "auto". */
        const sizeChange = {
          w:
            typeof cursorBlockOldSize.w === 'number'
              ? width - cursorBlockOldSize.w
              : 0,
          h:
            typeof cursorBlockOldSize.h === 'number'
              ? height - cursorBlockOldSize.h
              : 0,
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.map(ref => {
            /** A block can be resized without being selected. */
            if (shouldResize(ref.id)) {
              return {
                ...ref,
                size: {
                  w:
                    typeof ref.size.w === 'number'
                      ? ref.size.w + sizeChange.w
                      : ref.size.w,
                  h:
                    typeof ref.size.h === 'number'
                      ? ref.size.h + sizeChange.h
                      : ref.size.h,
                },
              }
            } else {
              return ref
            }
          }),
        })

        db.updateConcept(newViewingConcept)

        const cursorBlockIndex = blocks.findIndex(b => b.id === id)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            /** Bring to cursor block to the top. */
            .slice(0, cursorBlockIndex)
            .concat(blocks.slice(cursorBlockIndex + 1))
            .concat(blocks[cursorBlockIndex])
            .map(b => {
              if (shouldResize(b.id)) {
                return updateBlockInstance(b, {
                  size: {
                    w:
                      typeof b.size.w === 'number'
                        ? b.size.w + sizeChange.w
                        : b.size.w,
                    h:
                      typeof b.size.h === 'number'
                        ? b.size.h + sizeChange.h
                        : b.size.h,
                  },
                })
              } else {
                return b
              }
            }),
        }
      }
      case Action.BlockSetMode: {
        const { id, mode } = action.data
        const oldBlock = state.blocks.find(b => b.id === id)
        /** Prevent adding garbage blocks. */
        if (!oldBlock) return state
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

        clearElementRectMap()

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
      case Action.Undo: {
        clearElementRectMap()

        const { expandHistory } = state
        const backToConceptId = expandHistory[expandHistory.length - 2]
        const concept = db.getConcept(backToConceptId)

        if (!concept) return state

        db.saveSettings({
          debugging: state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: backToConceptId,
        })

        return {
          ...state,
          viewingConcept: concept,
          camera: concept.camera,
          blocks: synthesizeView(concept, db),
          expandHistory: [''].concat(expandHistory.slice(0, -1)),
        }
      }
    }
  }
}
