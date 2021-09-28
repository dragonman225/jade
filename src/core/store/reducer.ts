import {
  viewportCoordsToEnvCoords,
  vecDiv,
  vecSub,
  vecAdd,
  normalizeToBox,
  isPointInRect,
} from '../utils'
import {
  createBlock,
  createBlockInstance,
  getSelectedBlockIds,
  updateBlockInstance,
  blockToBox,
  deselectAllBlocks,
} from '../utils/block'
import { createConcept, updateConcept } from '../utils/concept'
import {
  createSimpleRelation,
  isBlockToBlockInCanvasRelation,
  isRelationExists,
  removeInvalidRelations,
} from '../utils/relation'
import { generateGuidelinesFromRects, RectSide, snapValue } from '../utils/snap'
import { blockRectManager } from '../utils/element-pool'
import { Action, Actions, ConceptCreatePositionIntent } from './actions'
import {
  ConceptId,
  DatabaseInterface,
  Block,
  PositionType,
  AppState,
  BlockInstance,
  Camera,
  FactoryRegistry,
  TypedConcept,
  BlockId,
  Entity,
  Vec2,
  Size,
  ContextType,
} from '../interfaces'

export function synthesizeView(
  viewingConcept: TypedConcept<unknown>,
  db: DatabaseInterface,
  existingBlockInstances?: BlockInstance[]
): BlockInstance[] {
  function blockToBlockInstance(block: Block) {
    if (!existingBlockInstances) return createBlockInstance(block)

    const existingBlockInstance = existingBlockInstances.find(
      b => b.id === block.id
    )
    if (existingBlockInstance) {
      existingBlockInstance.conceptId = block.to
      existingBlockInstance.posType = block.posType
      existingBlockInstance.pos = block.pos
      existingBlockInstance.size = block.size
      existingBlockInstance.color = block.color
      existingBlockInstance.lastEditedTime = block.lastEditedTime
      return existingBlockInstance
    } else {
      return createBlockInstance(block)
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
    pointerOffsetInCursorBox: { x: 0, y: 0 },
    selectedBlockIds: [],
    blocks,
    blocksRendered: false,
    relations: removeInvalidRelations(
      viewingConcept.relations.filter(r => isBlockToBlockInCanvasRelation(r)),
      blocks
    ),
    drawingRelation: false,
    drawingRelationFromBlockId: '',
    drawingRelationToPoint: { x: 0, y: 0 },
    contextMenuState: {
      shouldShow: false,
      pos: { x: 0, y: 0 },
      data: {
        contextType: ContextType.InferFromPointer,
        pointerInViewportCoords: { x: 0, y: 0 },
      },
    },
  }
}

export function createAppStateReducer(
  db: DatabaseInterface,
  factoryRegistry: FactoryRegistry
): (state: AppState, action: Actions) => AppState {
  const defaultSize: { w: number; h: 'auto' } = { w: 300, h: 'auto' }
  const defaultGap = 5

  /**
   * "Cursor Block" is a block that fires actions when multiple blocks are
   * selected.
   */
  let prevCursorBlockId = ''
  let cursorBlockNewSize: { w: number; h: number } = { w: 0, h: 0 }
  /** A block that the pointer is on. */
  let pointerOverBlock: BlockInstance | undefined = undefined

  return function appStateReducer(state: AppState, action: Actions): AppState {
    // console.log(`core/store/reducer: "${action.type}"`, action)
    blockRectManager.updateCamera(state.camera)

    /** Press `Ctrl` + `K` > `4` to fold all actions. */
    switch (action.type) {
      case Action.ConceptCreate: {
        const { posType } = action.data
        const { camera } = state
        const defaultType = factoryRegistry.getDefaultContentFactory().id
        const newConcept = createConcept(defaultType)
        const newBlockBox: (Vec2 & Size) | undefined = (() => {
          switch (action.data.intent) {
            case ConceptCreatePositionIntent.ExactAt: {
              return {
                ...viewportCoordsToEnvCoords(
                  action.data.pointerInViewportCoords,
                  camera
                ),
                ...defaultSize,
              }
            }
            case ConceptCreatePositionIntent.Below: {
              const targetBlockRect = blockRectManager.getRect(
                action.data.blockId
              )
              return (
                targetBlockRect && {
                  x: targetBlockRect.left,
                  y: targetBlockRect.bottom + defaultGap,
                  w: targetBlockRect.width,
                  h: defaultSize.h,
                }
              )
            }
            case ConceptCreatePositionIntent.Above: {
              const targetBlockRect = blockRectManager.getRect(
                action.data.blockId
              )
              return (
                targetBlockRect && {
                  x: targetBlockRect.left,
                  y: targetBlockRect.top - 50 + defaultGap,
                  w: targetBlockRect.width,
                  h: defaultSize.h,
                }
              )
            }
            case ConceptCreatePositionIntent.LeftOf: {
              const targetBlockRect = blockRectManager.getRect(
                action.data.blockId
              )
              return (
                targetBlockRect && {
                  x: targetBlockRect.left - defaultSize.w - defaultGap,
                  y: targetBlockRect.top,
                  w: targetBlockRect.width,
                  h: defaultSize.h,
                }
              )
            }
            case ConceptCreatePositionIntent.RightOf: {
              const targetBlockRect = blockRectManager.getRect(
                action.data.blockId
              )
              return (
                targetBlockRect && {
                  x: targetBlockRect.right + defaultGap,
                  y: targetBlockRect.top,
                  w: targetBlockRect.width,
                  h: defaultSize.h,
                }
              )
            }
          }
        })()
        if (!newBlockBox) return state
        const newBlock = createBlock({
          to: newConcept.id,
          posType,
          pos: newBlockBox,
          size: newBlockBox,
        })
        const newBlockInstance = createBlockInstance(newBlock)
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.concat(newBlock),
        })

        db.createConcept(newConcept)
        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: deselectAllBlocks(state.blocks).concat(newBlockInstance),
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
        const { blocks, selectedBlockIds } = state
        const cursorBlockId = action.data.id
        const cursorBlock =
          cursorBlockId && blocks.find(b => cursorBlockId === b.id)

        const shouldRemove = (blockId: BlockId): boolean => {
          return cursorBlock
            ? cursorBlock.selected
              ? /** If cursorBlock is selected, we remove all selected blocks. */
                selectedBlockIds.includes(blockId)
              : /** Otherwise, we just remove the cursorBlock. */
                blockId === cursorBlock.id
            : selectedBlockIds.includes(blockId)
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.filter(
            b => !shouldRemove(b.id)
          ),
          relations: state.viewingConcept.relations.filter(
            r => !shouldRemove(r.fromId) && !shouldRemove(r.toId)
          ),
        })

        db.updateConcept(newViewingConcept)

        blockRectManager.deleteBlocks(
          blocks.filter(b => shouldRemove(b.id)).map(b => b.id)
        )

        return {
          ...state,
          viewingConcept: newViewingConcept,
          relations: newViewingConcept.relations,
          blocks: synthesizeView(newViewingConcept, db),
        }
      }
      case Action.BlockMoveStart: {
        const { id, pointerInViewportCoords } = action.data
        const { blocks, selectedBlockIds: currSeletedBlockIds, camera } = state

        if (blocks.find(b => id === b.id)?.posType !== PositionType.Normal) {
          console.warn(
            'reducer/BlockMoveStart: No support for moving non-normal positioned blocks.'
          )
          return state
        }

        const selectedBlockIds = currSeletedBlockIds.length
          ? currSeletedBlockIds.includes(id)
            ? currSeletedBlockIds
            : [id]
          : [id]
        const cursorBlock = blocks.find(b => id === b.id)
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
          pointerOffsetInCursorBox: vecSub(pointerInEnvCoords, cursorBlock.pos),
        }
      }
      case Action.BlockMove: {
        const { id, pointerInViewportCoords } = action.data

        const {
          selectedBlockIds,
          blocks,
          camera,
          pointerOffsetInCursorBox,
        } = state

        if (blocks.find(b => id === b.id)?.posType !== PositionType.Normal) {
          console.warn(
            'reducer: No support for moving non-normal positioned blocks.'
          )
          return state
        }

        const pointerInEnvCoords = viewportCoordsToEnvCoords(
          pointerInViewportCoords,
          camera
        )

        const cursorBlock = blocks.find(b => id === b.id)
        const cursorBlockBox = blockToBox(cursorBlock)
        const cursorBlockDesiredPos = vecSub(
          pointerInEnvCoords,
          pointerOffsetInCursorBox
        )

        const shouldMove = (blockId: BlockId): boolean => {
          return cursorBlock.selected
            ? /** If cursorBlock is selected, we move all selected blocks. */
              selectedBlockIds.includes(blockId)
            : /** Otherwise, we just move the cursorBlock. */
              blockId === cursorBlock.id
        }

        const guidelineRects = blocks
          .filter(b => !shouldMove(b.id) && b.posType === PositionType.Normal)
          .map(b => {
            const envRect = blockRectManager.getRect(b.id)
            return {
              ...b.pos,
              w: typeof b.size.w === 'number' ? b.size.w : envRect.width,
              h: typeof b.size.h === 'number' ? b.size.h : envRect.height,
            }
          })

        const generationTolerance = 36
        const gap = defaultGap

        const {
          horizontalGuidelines,
          verticalGuidelines,
        } = generateGuidelinesFromRects(
          cursorBlockBox,
          guidelineRects,
          generationTolerance
        )

        const snapTolerance = 12

        /**
         * Try to snap all sides to guidelines. (Since we are moving, all
         * sides are changing.)
         */
        const snapResult = {
          left: snapValue(
            cursorBlockDesiredPos.x,
            verticalGuidelines,
            snapTolerance
          ),
          top: snapValue(
            cursorBlockDesiredPos.y,
            horizontalGuidelines,
            snapTolerance
          ),
          right: snapValue(
            cursorBlockDesiredPos.x + cursorBlockBox.w,
            verticalGuidelines,
            snapTolerance
          ),
          bottom: snapValue(
            cursorBlockDesiredPos.y + cursorBlockBox.h,
            horizontalGuidelines,
            snapTolerance
          ),
        }

        /**
         * Calculate the final position, but note that x may come from
         * snapping left or right, and y may come from snapping top or
         * bottom, we need to do some coordination.
         *
         * Also, we need to consider whether to add a gap, depending on
         * which side of a rect the guideline was generated from.
         */
        const xShouldUse = (() => {
          if (snapResult.left.guideline && snapResult.right.guideline) {
            /** Whether desire is closer to left or right? */
            if (
              Math.abs(cursorBlockDesiredPos.x - snapResult.left.value) <
              Math.abs(
                cursorBlockDesiredPos.x +
                  cursorBlockBox.w -
                  snapResult.right.value
              )
            ) {
              return 'left'
            } else {
              return 'right'
            }
          } else if (snapResult.left.guideline) {
            return 'left'
          } else {
            return 'right'
          }
        })()

        const yShouldUse = (() => {
          if (snapResult.top.guideline && snapResult.bottom.guideline) {
            /** Whether desire is closer to left or right? */
            if (
              Math.abs(cursorBlockDesiredPos.y - snapResult.top.value) <
              Math.abs(
                cursorBlockDesiredPos.y +
                  cursorBlockBox.h -
                  snapResult.bottom.value
              )
            ) {
              return 'top'
            } else {
              return 'bottom'
            }
          } else if (snapResult.top.guideline) {
            return 'top'
          } else {
            return 'bottom'
          }
        })()

        const cursorBlockNewPos = {
          x:
            xShouldUse === 'right'
              ? snapResult.right.guideline
                ? snapResult.right.guideline.fromSide === RectSide.Left
                  ? snapResult.right.value - gap - cursorBlockBox.w // another left - cursor right
                  : snapResult.right.value - cursorBlockBox.w
                : snapResult.right.value - cursorBlockBox.w
              : snapResult.left.guideline
              ? snapResult.left.guideline.fromSide === RectSide.Right
                ? snapResult.left.value + gap // another right - cursor left
                : snapResult.left.value
              : snapResult.left.value, // Not snapping on left / right, just pass-through
          y:
            yShouldUse === 'bottom'
              ? snapResult.bottom.guideline
                ? snapResult.bottom.guideline.fromSide === RectSide.Top
                  ? snapResult.bottom.value - gap - cursorBlockBox.h // another top - cursor bottom
                  : snapResult.bottom.value - cursorBlockBox.h
                : snapResult.bottom.value - cursorBlockBox.h
              : snapResult.top.guideline
              ? snapResult.top.guideline.fromSide === RectSide.Bottom
                ? snapResult.top.value + gap // another bottom - cursor top
                : snapResult.top.value
              : snapResult.top.value, // Not snapping on top / bottom, just pass-through
        }

        /**
         * Calculate the final movement so that we can apply it to all
         * selected blocks.
         */
        const cursorBlockFinalMovement = {
          x: cursorBlockNewPos.x - cursorBlock.pos.x,
          y: cursorBlockNewPos.y - cursorBlock.pos.y,
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.map(ref => {
            if (shouldMove(ref.id)) {
              return {
                ...ref,
                pos: vecAdd(ref.pos, cursorBlockFinalMovement),
              }
            } else {
              return ref
            }
          }),
        })

        const cursorBlockIndex = blocks.findIndex(b => b.id === id)

        pointerOverBlock = (() => {
          for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i]
            const blockRect = blockRectManager.getRect(block.id)
            if (
              /** It makes no sense to over itself. */
              block.id !== id &&
              blockRect &&
              isPointInRect(
                viewportCoordsToEnvCoords(pointerInViewportCoords, camera),
                blockRect
              )
            )
              return block
          }
          return undefined
        })()

        const shouldHighlight = (blockId: BlockId): boolean => {
          return blockId === (pointerOverBlock && pointerOverBlock.id)
        }

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks
            /** Bring to cursor block to the top. */
            .slice(0, cursorBlockIndex)
            .concat(blocks.slice(cursorBlockIndex + 1))
            .concat(blocks[cursorBlockIndex])
            .map(b => ({
              ...b,
              highlighted: shouldHighlight(b.id) ? true : false,
              pos: shouldMove(b.id)
                ? vecAdd(b.pos, cursorBlockFinalMovement)
                : b.pos,
            })),
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

          const targetConcept = db.getConcept(pointerOverBlock.conceptId)

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
            relations: viewingConcept.relations.filter(
              r =>
                !selectedBlockIds.includes(r.fromId) &&
                !selectedBlockIds.includes(r.toId)
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
            relations: targetConcept.relations.concat(
              viewingConcept.relations.filter(
                r =>
                  selectedBlockIds.includes(r.fromId) &&
                  selectedBlockIds.includes(r.toId)
              )
            ),
          })

          db.updateConcept(newViewingConcept)
          db.updateConcept(newTargetConcept)

          return {
            ...state,
            viewingConcept: newViewingConcept,
            pointerOffsetInCursorBox: { x: 0, y: 0 },
            blocks: blocks
              .filter(b => !movingBlocks.includes(b))
              .map(b => ({
                ...b,
                highlighted: false,
              })),
            relations: newViewingConcept.relations,
            /** Blocks are moved into another concept, so reset it. */
            selectedBlockIds: [],
          }
        }

        return {
          ...state,
          pointerOffsetInCursorBox: { x: 0, y: 0 },
          blocks: state.blocks.map(b =>
            updateBlockInstance(b, { highlighted: false })
          ),
        }
      }
      case Action.BlockResize: {
        const { id, movementInViewportCoords } = action.data
        const { camera, blocks, selectedBlockIds } = state

        const cursorBlock = state.blocks.find(b => b.id === id)
        const cursorBlockRectInEnvCoords = blockRectManager.getRect(id)
        const cursorBlockOldSize = cursorBlock.size

        cursorBlockNewSize =
          prevCursorBlockId !== id
            ? /** The first resize action of a block. */
              {
                w:
                  typeof cursorBlockOldSize.w === 'number'
                    ? cursorBlockOldSize.w +
                      movementInViewportCoords.x / camera.scale
                    : cursorBlockRectInEnvCoords.width,
                h:
                  typeof cursorBlockOldSize.h === 'number'
                    ? cursorBlockOldSize.h +
                      movementInViewportCoords.y / camera.scale
                    : cursorBlockRectInEnvCoords.height,
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
          .filter(b => !shouldResize(b.id) && b.posType === PositionType.Normal)
          .map(b => {
            const envRect = blockRectManager.getRect(b.id)
            return {
              ...b.pos,
              w: typeof b.size.w === 'number' ? b.size.w : envRect.width,
              h: typeof b.size.h === 'number' ? b.size.h : envRect.height,
            }
          })

        const generationTolerance = 36 / camera.scale
        const gap = defaultGap

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
      case Action.BlockSetColor: {
        const { id, color } = action.data
        const { blocks, selectedBlockIds } = state

        const cursorBlock = blocks.find(b => b.id === id)
        /** Prevent adding garbage blocks. */
        if (!cursorBlock) return state

        const shouldSetColor = (blockId: BlockId): boolean => {
          return cursorBlock.selected
            ? selectedBlockIds.includes(blockId)
            : blockId === cursorBlock.id
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.map(ref => {
            if (shouldSetColor(ref.id)) {
              return {
                ...ref,
                color,
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
              if (shouldSetColor(b.id)) {
                return updateBlockInstance(b, {
                  color,
                })
              } else {
                return b
              }
            }),
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
          blocksRendered: false,
          relations: concept.relations,
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
          blocks: deselectAllBlocks(state.blocks),
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
      case Action.CameraSetValue: {
        const { viewingConcept, camera } = state
        const newCamera = { ...camera, ...action.data }
        const newConcept = updateConcept(viewingConcept, {
          camera: newCamera,
        })

        db.updateConcept(newConcept)

        return {
          ...state,
          viewingConcept: newConcept,
          camera: newCamera,
        }
      }
      case Action.RelationDrawStart: {
        const { id, pointerInViewportCoords } = action.data
        const { camera } = state

        return {
          ...state,
          drawingRelation: true,
          drawingRelationFromBlockId: id,
          drawingRelationToPoint: viewportCoordsToEnvCoords(
            pointerInViewportCoords,
            camera
          ),
        }
      }
      case Action.RelationDrawMove: {
        const { pointerInViewportCoords } = action.data
        const { camera, blocks } = state

        const pointerInEnvCoords = viewportCoordsToEnvCoords(
          pointerInViewportCoords,
          camera
        )

        const targetBlock = (() => {
          for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i]
            const rect = blockRectManager.getRect(block.id)
            if (rect && isPointInRect(pointerInEnvCoords, rect)) return block
          }
          return undefined
        })()

        return {
          ...state,
          blocks: blocks.map(b =>
            updateBlockInstance(b, {
              highlighted: !!targetBlock && b.id === targetBlock.id,
            })
          ),
          drawingRelationToPoint: viewportCoordsToEnvCoords(
            pointerInViewportCoords,
            camera
          ),
        }
      }
      case Action.RelationDrawEnd: {
        const { id, pointerInViewportCoords } = action.data
        const { blocks, relations, camera, viewingConcept } = state

        const targetBlock = (() => {
          for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i]
            if (
              /** Disallow drawing a relation to itself. */
              block.id !== id &&
              /** Disallow drawing a relation to non-normal blocks. */
              block.posType === PositionType.Normal &&
              isPointInRect(
                viewportCoordsToEnvCoords(pointerInViewportCoords, camera),
                blockRectManager.getRect(block.id)
              )
            )
              return block
          }
          return undefined
        })()

        const newRelationProps = targetBlock && {
          type: 'block-to-block-in-canvas',
          fromEntity: Entity.Block,
          fromId: id,
          toEntity: Entity.Block,
          toId: targetBlock.id,
        }

        const newRelation =
          newRelationProps &&
          /** Disallow drawing duplicate 'block-to-block-in-canvas' relations. */
          !isRelationExists(relations, newRelationProps) &&
          createSimpleRelation(newRelationProps)

        const newViewingConcept = updateConcept(viewingConcept, {
          relations: newRelation
            ? relations.concat(newRelation)
            : viewingConcept.relations,
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks.map(b =>
            updateBlockInstance(b, { highlighted: false })
          ),
          relations: newViewingConcept.relations,
          drawingRelation: false,
          drawingRelationFromBlockId: '',
          drawingRelationToPoint: { x: 0, y: 0 },
        }
      }
      case Action.RelationRemove: {
        const { id } = action.data
        const { viewingConcept, relations } = state

        const newViewingConcept = updateConcept(viewingConcept, {
          relations: relations.filter(r => r.id !== id),
        })

        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          relations: newViewingConcept.relations,
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
          blocksRendered: false,
          relations: concept.relations,
          expandHistory: [''].concat(expandHistory.slice(0, -1)),
        }
      }
      case Action.BlocksRendered: {
        return {
          ...state,
          blocksRendered: true,
        }
      }
      case Action.ContextMenuOpen: {
        const { pointerInViewportCoords } = action.data

        return {
          ...state,
          contextMenuState: {
            shouldShow: true,
            pos: pointerInViewportCoords,
            data: action.data,
          },
        }
      }
      case Action.ContextMenuClose: {
        return {
          ...state,
          contextMenuState: {
            shouldShow: false,
            pos: { x: 0, y: 0 },
            data: {
              contextType: ContextType.InferFromPointer,
              pointerInViewportCoords: { x: 0, y: 0 },
            },
          },
        }
      }
    }
  }
}
