import * as React from 'react'
import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
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

export function Block({
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
  const blockElRef = useRef<HTMLDivElement>(null)
  const widthResizerElRef = useRef<HTMLDivElement>(null)
  const heightResizerElRef = useRef<HTMLDivElement>(null)
  const widthHeightResizerElRef = useRef<HTMLDivElement>(null)
  const arrowTriggerElRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<InteractionMode>(mode)
  const [isHovering, setIsHovering] = useState(false)

  /** Register the block element so other places can query its rect. */
  useEffect(() => {
    blockRectManager.setElement(id, blockElRef.current)
    return () => blockRectManager.detachElement(id)
  }, [id])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

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
    const blockEl = blockElRef.current

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

      if (modeRef.current === InteractionMode.Moving)
        dispatchAction({ type: Action.BlockMoveEnd })

      /** "Focusing" is controlled by the concept display. */
      if (
        modeRef.current === InteractionMode.Moving ||
        modeRef.current === InteractionMode.Resizing
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
          if (modeRef.current !== InteractionMode.Focusing) e.preventDefault()
          /** Trigger context menu on right-click when idle. */
          if (e.button === 2 && modeRef.current === InteractionMode.Idle) {
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

      const widthResizerEl = widthResizerElRef.current
      const heightResizerEl = heightResizerElRef.current
      const widthHeightResizerEl = widthHeightResizerElRef.current
      const arrowTriggerEl = arrowTriggerElRef.current

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
      } else if (modeRef.current !== InteractionMode.Focusing) {
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
    function preventContextMenu(e: MouseEvent) {
      if (modeRef.current !== InteractionMode.Focusing) e.preventDefault()
    }

    const blockEl = blockElRef.current
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
      ref={blockElRef}
      className={blockClassName}
      data-color={color}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {children}
      {allowResizeWidth && (
        <div ref={widthResizerElRef} className={styles.widthResizer} />
      )}
      {allowResizeHeight && (
        <div ref={heightResizerElRef} className={styles.heightResizer} />
      )}
      {allowResizeWidth && allowResizeHeight && (
        <div
          ref={widthHeightResizerElRef}
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
              ref={arrowTriggerElRef}
              className={classes(styles.actionButton, styles.arrow)}>
              <ArrowNorthEast />
            </div>
          </>
        )}
      {highlighted && <div className={styles.highlightOverlay} />}
    </div>
  )
}
