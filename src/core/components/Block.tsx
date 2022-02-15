import * as React from 'react'
import {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react'
import { classes } from 'typestyle'

import { ArrowNorthEast } from './Icons/ArrowNorthEast'
import { OpenInFull } from './Icons/OpenInFull'
import { styles } from './Block.styles'
import { distanceOf, getUnifiedClientCoords, vecSub } from '../utils'
import { blockRectManager } from '../utils/blockRectManager'
import { Action, Actions } from '../store/actions'
import {
  BlockColor,
  BlockId,
  ConceptId,
  ContextType,
  InteractionMode,
} from '../interfaces'

interface Props {
  id: BlockId
  conceptId: ConceptId
  color: BlockColor | undefined
  mode: InteractionMode
  selected: boolean
  highlighted: boolean
  blink: boolean
  allowResizeWidth?: boolean
  allowResizeHeight?: boolean
  dispatchAction: (action: Actions) => void
  className?: string
  children?: React.ReactNode
}

export const Block = React.memo(function Block({
  id,
  conceptId,
  color,
  mode,
  selected,
  highlighted,
  blink,
  allowResizeWidth = true,
  allowResizeHeight = false,
  dispatchAction,
  className,
  children,
}: Props): JSX.Element {
  const rBlockEl = useRef<HTMLDivElement>(null)
  const rWidthResizerEl = useRef<HTMLDivElement>(null)
  const rHeightResizerEl = useRef<HTMLDivElement>(null)
  const rWidthHeightResizerEl = useRef<HTMLDivElement>(null)
  const rArrowTriggerEl = useRef<HTMLDivElement>(null)
  const rMode = useRef<InteractionMode>(mode)
  const [isHovering, setIsHovering] = useState(false)

  /** Register the block element so other places can query its rect. */
  useLayoutEffect(() => {
    if (rBlockEl.current) blockRectManager.setElement(id, rBlockEl.current)
    return () => blockRectManager.detachElement(id)
  }, [id])

  useEffect(() => {
    rMode.current = mode
  }, [mode])

  /** Reset focus on unmount or the block may go into an irrecoverable state. */
  useEffect(
    () => () => {
      if (rMode.current === InteractionMode.Focusing) {
        dispatchAction({
          type: Action.BlockSetMode,
          data: { id, mode: InteractionMode.Idle },
        })
      }
    },
    [id, dispatchAction]
  )

  /** Advanced gesture detection. */
  const gestureModeRef = useRef<
    | 'idle'
    | 'ready_to_move'
    | 'move'
    | 'resizeWH'
    | 'resizeW'
    | 'resizeH'
    | 'drawArrow'
  >('idle')
  const lastClientCoordsRef = useRef({ x: 0, y: 0 })
  const pointerDownCoordsRef = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const blockEl = rBlockEl.current
    if (!blockEl) return

    function onPointerUp(e: MouseEvent | TouchEvent) {
      /**
       * Think about a case: Mouse down with left button, mouse up with
       * right button -> should not trigger below actions.
       */
      if (e instanceof MouseEvent && e.button !== 0) {
        return
      }

      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      window.removeEventListener('touchcancel', onPointerUp)

      const lastClientCoords = lastClientCoordsRef.current

      switch (gestureModeRef.current) {
        case 'drawArrow': {
          dispatchAction({
            type: Action.RelationDrawEnd,
            data: {
              id,
              /**
               * Use `lastClientCoords` since `e.touches` has zero-length
               * on `touchend`.
               */
              pointerInViewportCoords: lastClientCoords,
            },
          })
          break
        }
      }

      gestureModeRef.current = 'idle'

      if (rMode.current === InteractionMode.Moving)
        dispatchAction({ type: Action.BlockMoveEnd })

      /** "Focusing" is controlled by the concept display. */
      if (
        rMode.current === InteractionMode.Moving ||
        rMode.current === InteractionMode.Resizing
      )
        dispatchAction({
          type: Action.BlockSetMode,
          data: { id, mode: InteractionMode.Idle },
        })
    }

    function onPointerMove(e: MouseEvent | TouchEvent) {
      const clientCoords = getUnifiedClientCoords(e)
      const movement = vecSub(clientCoords, lastClientCoordsRef.current)
      lastClientCoordsRef.current = clientCoords

      switch (gestureModeRef.current) {
        case 'ready_to_move': {
          if (distanceOf(clientCoords, pointerDownCoordsRef.current) > 3) {
            gestureModeRef.current = 'move'
            dispatchAction({
              type: Action.BlockMoveStart,
              data: { id, pointerInViewportCoords: clientCoords },
            })
          }
          break
        }
        case 'move': {
          dispatchAction({
            type: Action.BlockMove,
            data: {
              id,
              pointerInViewportCoords: clientCoords,
            },
          })
          dispatchAction({
            type: Action.BlockSetMode,
            data: { id, mode: InteractionMode.Moving },
          })
          break
        }
        case 'resizeW':
        case 'resizeH':
        case 'resizeWH': {
          const gestureMode = gestureModeRef.current
          dispatchAction({
            type: Action.BlockResizeDelta,
            data: {
              id,
              /**
               * So that we can resize only one direction for blocks that
               * allow both.
               */
              movementInViewportCoords: {
                x:
                  gestureMode === 'resizeW' || gestureMode === 'resizeWH'
                    ? movement.x
                    : 0,
                y:
                  gestureMode === 'resizeH' || gestureMode === 'resizeWH'
                    ? movement.y
                    : 0,
              },
            },
          })
          dispatchAction({
            type: Action.BlockSetMode,
            data: { id, mode: InteractionMode.Resizing },
          })
          break
        }
        case 'drawArrow': {
          dispatchAction({
            type: Action.RelationDrawMove,
            data: { id, pointerInViewportCoords: clientCoords },
          })
          break
        }
      }
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const clientCoords = getUnifiedClientCoords(e)
      lastClientCoordsRef.current = clientCoords

      if (e instanceof MouseEvent) {
        /** Reject non-primary button. */
        if (e.button !== 0) {
          /** Prevent focus if InteractionMode is not Focusing. */
          if (rMode.current !== InteractionMode.Focusing) e.preventDefault()
          /** Trigger context menu on right-click when idle. */
          if (e.button === 2 && rMode.current === InteractionMode.Idle) {
            dispatchAction({
              type: Action.ContextMenuOpen,
              data: {
                contextType: ContextType.InferFromPointer,
                pointerInViewportCoords: clientCoords,
              },
            })
          }
          return
        }
      }

      const widthResizerEl = rWidthResizerEl.current
      const heightResizerEl = rHeightResizerEl.current
      const widthHeightResizerEl = rWidthHeightResizerEl.current
      const arrowTriggerEl = rArrowTriggerEl.current

      if (widthResizerEl && widthResizerEl.contains(e.target as Node))
        gestureModeRef.current = 'resizeW'
      else if (heightResizerEl && heightResizerEl.contains(e.target as Node))
        gestureModeRef.current = 'resizeH'
      else if (
        widthHeightResizerEl &&
        widthHeightResizerEl.contains(e.target as Node)
      )
        gestureModeRef.current = 'resizeWH'
      else if (arrowTriggerEl && arrowTriggerEl.contains(e.target as Node)) {
        gestureModeRef.current = 'drawArrow'
        dispatchAction({
          type: Action.RelationDrawStart,
          data: { id, pointerInViewportCoords: clientCoords },
        })
      } else if (rMode.current !== InteractionMode.Focusing) {
        gestureModeRef.current = 'ready_to_move'
      }

      window.addEventListener('mousemove', onPointerMove)
      window.addEventListener('touchmove', onPointerMove)
      window.addEventListener('mouseup', onPointerUp)
      window.addEventListener('touchend', onPointerUp)
      window.addEventListener('touchcancel', onPointerUp)
    }

    blockEl.addEventListener('mousedown', onPointerDown)
    blockEl.addEventListener('touchstart', onPointerDown)

    return () => {
      blockEl.removeEventListener('mousedown', onPointerDown)
      blockEl.removeEventListener('touchstart', onPointerDown)
    }
  }, [id, dispatchAction])

  /** Disable system context menu when not focusing since we're showing our own. */
  useEffect(() => {
    const blockEl = rBlockEl.current
    if (!blockEl) return

    function preventContextMenu(e: MouseEvent) {
      if (rMode.current !== InteractionMode.Focusing) e.preventDefault()
    }

    blockEl.addEventListener('contextmenu', preventContextMenu)

    return () => {
      blockEl.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [])

  const blockClassName = useMemo(() => {
    return classes(
      className,
      styles.block,
      allowResizeHeight && styles.fillParentHeight,
      selected && styles.selected,
      mode === InteractionMode.Focusing && styles.focusing,
      mode === InteractionMode.Moving && styles.moving
    )
  }, [mode, selected, allowResizeHeight, className])

  const handleMouseEnter = useCallback(() => setIsHovering(true), [])
  const handleMouseLeave = useCallback(() => setIsHovering(false), [])
  const openAsCanvas = useCallback(() => {
    dispatchAction({
      type: Action.BlockOpenAsCanvas,
      data: { id: conceptId },
    })
  }, [conceptId, dispatchAction])

  return (
    <div
      ref={rBlockEl}
      className={blockClassName}
      data-color={color}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {children}
      {allowResizeWidth && (
        <div ref={rWidthResizerEl} className={styles.widthResizer} />
      )}
      {allowResizeHeight && (
        <div ref={rHeightResizerEl} className={styles.heightResizer} />
      )}
      {allowResizeWidth && allowResizeHeight && (
        <div
          ref={rWidthHeightResizerEl}
          className={styles.widthHeightResizer}
        />
      )}
      {!isHovering && blink && <div className={styles.blink} />}
      {(mode === InteractionMode.Idle || mode === InteractionMode.Focusing) &&
        isHovering && (
          <>
            <div
              className={classes(styles.actionButton, styles.open)}
              onClick={openAsCanvas}>
              <OpenInFull />
            </div>
            <div
              ref={rArrowTriggerEl}
              className={classes(styles.actionButton, styles.arrow)}>
              <ArrowNorthEast />
            </div>
          </>
        )}
      {highlighted && <div className={styles.highlightOverlay} />}
    </div>
  )
})
