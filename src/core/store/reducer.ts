import {
  viewportCoordsToEnvCoords,
  vecDiv,
  vecSub,
  vecAdd,
  normalizeToBox,
  isPointInRect,
  getBoundingBox,
} from '../utils'
import {
  createBlock,
  createBlockInstance,
  getSelectedBlockIds,
  updateBlockInstance,
  blockToBox,
  deselectAllBlocks,
  getFocusForBlock,
  findBlock,
  blockInstanceToBlock,
  bringBlocksToTop,
} from '../utils/block'
import { blockRectManager } from '../utils/blockRectManager'
import { createConcept, updateConcept } from '../utils/concept'
import {
  createSimpleRelation,
  isBlockToBlockInCanvasRelation,
  isRelationExists,
  removeInvalidRelations,
} from '../utils/relation'
import { generateGuidelinesFromRects, RectSide, snapValue } from '../utils/snap'
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
  InteractionMode,
} from '../interfaces'

export function synthesizeView(
  viewingConcept: TypedConcept<unknown>,
  db: DatabaseInterface,
  existingBlockInstances?: BlockInstance[]
): BlockInstance[] {
  function blockToBlockInstance(block: Block, index: number) {
    if (!existingBlockInstances) return createBlockInstance(block, index)

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
      return createBlockInstance(block, index)
    }
  }

  const overlayConcept = db.getConcept('__tool_mask__')
  const overlayBlocks = overlayConcept
    ? overlayConcept.references.map(blockToBlockInstance)
    : []
  const viewingBlocks = viewingConcept.references.map(blockToBlockInstance)

  return overlayBlocks.concat(viewingBlocks)
}

export function loadAppState(db: DatabaseInterface): AppState {
  console.log('core/store/reducer: Loading app state')

  const settings = db.getSettings()
  const viewingConcept = db.getConcept(settings.viewingConceptId)
  const blocks = synthesizeView(viewingConcept, db)

  return {
    settings,
    viewingConcept,
    expandHistory: new Array(99).concat(viewingConcept.id) as (
      | ConceptId
      | undefined
    )[],
    camera: viewingConcept.camera,
    shouldAnimateCamera: false,
    selecting: false,
    selectionBoxStart: { x: 0, y: 0 },
    selectionBoxEnd: { x: 0, y: 0 },
    selectionBox: { x: 0, y: 0, w: 0, h: 0 },
    pointerOffsetInLeaderBox: { x: 0, y: 0 },
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
    isMovingBlocks: false,
    clipboard: [],
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

    /** Press `Ctrl` + `K` > `4` to fold all actions. */
    switch (action.type) {
      case Action.ConceptCreate: {
        const { posType } = action.data
        const { camera, blocks } = state
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
        const newBlockInstance = createBlockInstance(newBlock, blocks.length)
        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.concat(newBlock),
        })

        db.createConcept(newConcept)
        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: deselectAllBlocks(state.blocks).concat(newBlockInstance),
          selectedBlockIds: [],
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

        if (action.data.id === state.viewingConcept.id)
          return {
            ...state,
            viewingConcept: newConcept,
          }
        else return state
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

        if (blocks.find(b => b.mode === InteractionMode.Focusing)) return state

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
      /** TODO: Block links are broken after cut/paste since it's moved to a 
          new canvas. */
      case Action.BlockCut: {
        const { blocks, selectedBlockIds, viewingConcept } = state

        if (blocks.find(b => b.mode !== InteractionMode.Idle)) return state
        if (selectedBlockIds.length === 0) return state

        const selectedBlockRects = selectedBlockIds.map(id =>
          blockRectManager.getRect(id)
        )
        const boundingRect = getBoundingBox(selectedBlockRects)
        /**
         * When pasting, the pointer should be at the center of the
         * bounding box of the pasted blocks. Below is used to calculate
         * where to put the pasted blocks.
         */
        const pasteOffset = {
          x: (boundingRect.left - boundingRect.right) / 2,
          y: (boundingRect.top - boundingRect.bottom) / 2,
        }
        const boundingBoxTopLeft = {
          x: boundingRect.left,
          y: boundingRect.top,
        }

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
        db.updateConcept(newViewingConcept)

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks.filter(b => !b.selected),
          relations: newViewingConcept.relations,
          /** Selected blocks are moved to clipbard. */
          selectedBlockIds: [],
          clipboard: state.clipboard.concat({
            pasteOffset,
            blocks: blocks
              .filter(b => b.selected)
              .map(b => ({
                ...b,
                /**
                 * Normalize positions to be relative to the top-left
                 * corner of the bounding box.
                 */
                pos: vecSub(b.pos, boundingBoxTopLeft),
              }))
              .map(blockInstanceToBlock),
            relations: state.relations.filter(
              r =>
                selectedBlockIds.includes(r.fromId) &&
                selectedBlockIds.includes(r.toId)
            ),
          }),
        }
      }
      case Action.BlockPaste: {
        const { pointerInViewportCoords } = action.data
        const { blocks, camera, clipboard, viewingConcept } = state

        const clip = clipboard.pop()
        if (!clip) return state

        const pointerInEnvCoords = viewportCoordsToEnvCoords(
          pointerInViewportCoords,
          camera
        )
        const pastedBlocksBoundingBoxTopLeft = vecAdd(
          pointerInEnvCoords,
          clip.pasteOffset
        )
        const pastedBlocks = clip.blocks.map(b => ({
          ...b,
          pos: vecAdd(b.pos, pastedBlocksBoundingBoxTopLeft),
        }))

        const newViewingConcept = updateConcept(viewingConcept, {
          references: viewingConcept.references.concat(pastedBlocks),
          relations: viewingConcept.relations.concat(clip.relations),
        })
        db.updateConcept(newViewingConcept)

        const pastedBlockInstances = pastedBlocks.map((b, i) =>
          updateBlockInstance(createBlockInstance(b, blocks.length + i), {
            selected: true,
          })
        )

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: state.blocks.concat(pastedBlockInstances),
          relations: state.relations.concat(clip.relations),
          selectedBlockIds: pastedBlockInstances.map(b => b.id),
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
          blocks: bringBlocksToTop(selectedBlockIds, blocks).map(b =>
            updateBlockInstance(b, {
              selected: selectedBlockIds.includes(b.id),
            })
          ),
          selectedBlockIds,
          pointerOffsetInLeaderBox: vecSub(pointerInEnvCoords, cursorBlock.pos),
          isMovingBlocks: true,
        }
      }
      case Action.BlockMove: {
        const { id, pointerInViewportCoords } = action.data

        const {
          selectedBlockIds,
          blocks,
          camera,
          pointerOffsetInLeaderBox,
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

        const leaderBlock = blocks.find(b => id === b.id)
        const leaderBlockBox = blockToBox(leaderBlock)
        const leaderBlockProposedPos = vecSub(
          pointerInEnvCoords,
          pointerOffsetInLeaderBox
        )

        const shouldMove = (blockId: BlockId): boolean => {
          return leaderBlock.selected
            ? /** If cursorBlock is selected, we move all selected blocks. */
              selectedBlockIds.includes(blockId)
            : /** Otherwise, we just move the cursorBlock. */
              blockId === leaderBlock.id
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
          leaderBlockBox,
          guidelineRects,
          generationTolerance
        )

        const snapTolerance = 12

        /**
         * Try to snap all sides to guidelines. (Since we are moving, all
         * sides can change.)
         */
        const snapResult = {
          left: snapValue(
            leaderBlockProposedPos.x,
            verticalGuidelines,
            snapTolerance
          ),
          top: snapValue(
            leaderBlockProposedPos.y,
            horizontalGuidelines,
            snapTolerance
          ),
          right: snapValue(
            leaderBlockProposedPos.x + leaderBlockBox.w,
            verticalGuidelines,
            snapTolerance
          ),
          bottom: snapValue(
            leaderBlockProposedPos.y + leaderBlockBox.h,
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
            /** Is proposed pos closer to left or right? */
            if (
              Math.abs(leaderBlockProposedPos.x - snapResult.left.value) <
              Math.abs(
                leaderBlockProposedPos.x +
                  leaderBlockBox.w -
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
            /** Is proposed pos closer to top or bottom? */
            if (
              Math.abs(leaderBlockProposedPos.y - snapResult.top.value) <
              Math.abs(
                leaderBlockProposedPos.y +
                  leaderBlockBox.h -
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

        const leaderBlockActualNewPos = {
          x:
            xShouldUse === 'right'
              ? snapResult.right.guideline
                ? snapResult.right.guideline.fromSide === RectSide.Left
                  ? snapResult.right.value - gap - leaderBlockBox.w // another left - leader right
                  : snapResult.right.value - leaderBlockBox.w
                : snapResult.right.value - leaderBlockBox.w
              : snapResult.left.guideline
              ? snapResult.left.guideline.fromSide === RectSide.Right
                ? snapResult.left.value + gap // another right - leader left
                : snapResult.left.value
              : snapResult.left.value, // Not snapping on left / right, just pass-through
          y:
            yShouldUse === 'bottom'
              ? snapResult.bottom.guideline
                ? snapResult.bottom.guideline.fromSide === RectSide.Top
                  ? snapResult.bottom.value - gap - leaderBlockBox.h // another top - leader bottom
                  : snapResult.bottom.value - leaderBlockBox.h
                : snapResult.bottom.value - leaderBlockBox.h
              : snapResult.top.guideline
              ? snapResult.top.guideline.fromSide === RectSide.Bottom
                ? snapResult.top.value + gap // another bottom - leader top
                : snapResult.top.value
              : snapResult.top.value, // Not snapping on top / bottom, just pass-through
        }

        /**
         * Calculate the final movement so that we can apply it to all
         * selected blocks.
         */
        const leaderBlockActualMovement = {
          x: leaderBlockActualNewPos.x - leaderBlock.pos.x,
          y: leaderBlockActualNewPos.y - leaderBlock.pos.y,
        }

        const newViewingConcept = updateConcept(state.viewingConcept, {
          references: state.viewingConcept.references.map(ref => {
            if (shouldMove(ref.id)) {
              return {
                ...ref,
                pos: vecAdd(ref.pos, leaderBlockActualMovement),
              }
            } else {
              return ref
            }
          }),
        })

        pointerOverBlock = (() => {
          for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i]
            /** Below logic only works for normal positioned blocks. */
            if (block.posType !== PositionType.Normal) return undefined
            /** Position may be wrong! */
            const blockRectRaw = blockRectManager.getRect(block.id)
            const blockRect = {
              top: block.pos.y,
              left: block.pos.x,
              bottom: block.pos.y + blockRectRaw.height,
              right: block.pos.x + blockRectRaw.width,
            }
            const pointerInEnvCoords = viewportCoordsToEnvCoords(
              pointerInViewportCoords,
              camera
            )
            if (
              /** It makes no sense to over itself. */
              block.id !== id &&
              blockRect &&
              isPointInRect(pointerInEnvCoords, blockRect)
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
          blocks: bringBlocksToTop([id], blocks).map(b => ({
            ...b,
            highlighted: shouldHighlight(b.id),
            pos: shouldMove(b.id)
              ? vecAdd(b.pos, leaderBlockActualMovement)
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
            pointerOffsetInLeaderBox: { x: 0, y: 0 },
            blocks: blocks
              .filter(b => !movingBlocks.includes(b))
              .map(b => ({
                ...b,
                highlighted: false,
              })),
            relations: newViewingConcept.relations,
            /** Blocks are moved into another concept, so reset it. */
            selectedBlockIds: [],
            isMovingBlocks: false,
          }
        }

        return {
          ...state,
          pointerOffsetInLeaderBox: { x: 0, y: 0 },
          blocks: state.blocks.map(b =>
            updateBlockInstance(b, { highlighted: false })
          ),
          isMovingBlocks: false,
        }
      }
      case Action.BlockResizeDelta: {
        const { id, movementInViewportCoords } = action.data
        const { camera, blocks, selectedBlockIds } = state

        const cursorBlock = blocks.find(b => b.id === id)
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

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: bringBlocksToTop([id], blocks).map(b => {
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
        const { blocks } = state

        return {
          ...state,
          blocks:
            mode !== InteractionMode.Idle
              ? bringBlocksToTop([id], blocks, block =>
                  updateBlockInstance(block, { mode })
                )
              : blocks.map(b => {
                  if (b.id === id) return updateBlockInstance(b, { mode })
                  else return b
                }),
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

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: bringBlocksToTop([id], blocks).map(b => {
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
      case Action.BlockSetSize: {
        const { id, size } = action.data
        const { blocks, viewingConcept } = state
        const blockInstance = findBlock(blocks, id)
        if (!blockInstance) return state
        const newBlockInstance = updateBlockInstance(blockInstance, { size })

        const newViewingConcept = updateConcept(viewingConcept, {
          references: viewingConcept.references.map(r =>
            r.id === id ? blockInstanceToBlock(newBlockInstance) : r
          ),
        })
        db.updateConcept(newViewingConcept)

        // HACK: If prevCursorBlock is X, and we set size for X, then we
        // resize it, size would be wrong.
        prevCursorBlockId = ''

        return {
          ...state,
          viewingConcept: newViewingConcept,
          blocks: blocks.map(b => (b.id === id ? newBlockInstance : b)),
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
        const { id: toConceptId, focusBlockId } = action.data
        const { blocks, settings } = state

        if (!toConceptId) return state

        /** Already in the target Canvas. Animate camera to the Block. */
        if (toConceptId === state.viewingConcept.id) {
          const block = blocks.find(b => b.id === focusBlockId)
          if (block) {
            const scale = 1
            const focus = getFocusForBlock(block, scale)
            return {
              ...state,
              camera: { focus, scale },
              shouldAnimateCamera: true,
              blocks: bringBlocksToTop([block.id], blocks).map(b =>
                updateBlockInstance(b, {
                  selected: b.id === focusBlockId,
                  mode: InteractionMode.Idle, // Clear focus
                })
              ),
              selectedBlockIds: [focusBlockId],
            }
          } else {
            return state
          }
        }

        const newSettings = {
          ...settings,
          viewingConceptId: toConceptId,
        }
        db.saveSettings(newSettings)

        /** Not in the target Canvas. Open it and set camera directly. */
        const concept = db.getConcept(toConceptId)
        const focusBlock = concept.references.find(r => r.id === focusBlockId)
        const newCamera = focusBlock && {
          focus: getFocusForBlock(focusBlock, 1),
          scale: 1,
        }

        return {
          ...state,
          settings: newSettings,
          viewingConcept: concept,
          camera: newCamera || concept.camera,
          shouldAnimateCamera: false,
          blocks: focusBlock
            ? bringBlocksToTop(
                [focusBlockId],
                synthesizeView(concept, db)
              ).map(b =>
                updateBlockInstance(b, { selected: b.id === focusBlockId })
              )
            : synthesizeView(concept, db),
          selectedBlockIds: focusBlock
            ? [focusBlockId]
            : state.selectedBlockIds,
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
        const movementInEnvCoords = vecDiv(action.data, state.camera.scale)

        const {
          selectionBoxStart,
          selecting,
          isMovingBlocks,
          blocks,
          camera,
          viewingConcept,
        } = state

        const newCamera: Camera = {
          ...camera,
          focus: vecSub(camera.focus, movementInEnvCoords),
        }

        /** Update selected blocks if the user is moving them. */
        const newBlocks = isMovingBlocks
          ? blocks.map(b =>
              b.posType === PositionType.Normal && b.selected
                ? updateBlockInstance(b, {
                    pos: vecSub(b.pos, movementInEnvCoords),
                  })
                : b
            )
          : blocks

        const newViewingConcept = updateConcept(viewingConcept, {
          camera: newCamera,
          references: newBlocks
            .filter(b => b.posType === PositionType.Normal)
            .map(b => blockInstanceToBlock(b)),
        })

        db.updateConcept(newViewingConcept)

        /**
         * Selecting and moving blocks may happen at the same time on
         * future devices with more expressive interfaces.
         */

        /** Also update selectionBox if the user is selecting. */
        if (selecting) {
          const selectionBoxEnd = vecSub(
            state.selectionBoxEnd,
            movementInEnvCoords
          )
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
            shouldAnimateCamera: false,
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
          shouldAnimateCamera: false,
          blocks: newBlocks,
        }
      }
      case Action.CameraScaleDelta: {
        const minScale = 0.05
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
          shouldAnimateCamera: true,
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
          shouldAnimateCamera: true,
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
      case Action.SettingsSet: {
        const updates = action.data
        const newSettings = {
          ...state.settings,
          ...updates,
        }

        db.saveSettings(newSettings)

        return {
          ...state,
          settings: newSettings,
        }
      }
      case Action.Undo: {
        const { expandHistory } = state
        const backToConceptId = expandHistory[expandHistory.length - 2]
        const concept = db.getConcept(backToConceptId)
        if (!concept) return state

        const newSettings = {
          ...state.settings,
          viewingConceptId: concept.id,
        }

        db.saveSettings(newSettings)

        return {
          ...state,
          settings: newSettings,
          viewingConcept: concept,
          camera: concept.camera,
          shouldAnimateCamera: false,
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
