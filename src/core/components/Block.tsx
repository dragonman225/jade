import * as React from 'react'
import { useRef, useEffect, useMemo } from 'react'
import { classes } from 'typestyle'

import { ArrowNorthEast } from './Icons/ArrowNorthEast'
import { OpenInFull } from './Icons/OpenInFull'
import { styles } from './Block.styles'
import { getUnifiedClientCoords, isPointInRect, vecSub } from '../utils'
import { blockRectManager } from '../utils/element-pool'
import { Action, Actions } from '../store/actions'
import { BlockColor, BlockId, ConceptId, InteractionMode } from '../interfaces'

interface Props {
  id: BlockId
  conceptId: ConceptId
  color: BlockColor | undefined
  mode: InteractionMode
  selected: boolean
  highlighted: boolean
  blink: boolean
  dispatchAction: (action: Actions) => void
  className?: string
  children?: React.ReactNode
}

const iconSize = 18

export function Block(props: Props): JSX.Element {
  const {
    id,
    conceptId,
    color,
    mode,
    selected,
    highlighted,
    blink,
    dispatchAction,
    className,
    children,
  } = props

  const blockRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const arrowTriggerRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<InteractionMode>(mode)

  useEffect(() => {
    blockRectManager.setElement(id, blockRef.current)

    return () => blockRectManager.detachElement(id)
  }, [id])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const gestureDetector = (() => {
      let intent: '' | 'move' | 'resize' | 'arrow' = ''
      let lastClientCoords = { x: 0, y: 0 }

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const clientCoords = getUnifiedClientCoords(e)
        const movement = vecSub(clientCoords, lastClientCoords)
        lastClientCoords = clientCoords

        if (intent === 'resize') {
          dispatchAction({
            type: Action.BlockResize,
            data: { id, movementInViewportCoords: movement },
          })
          dispatchAction({
            type: Action.BlockSetMode,
            data: { id, mode: InteractionMode.Resizing },
          })
        } else if (intent === 'move') {
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
        } else if (intent === 'arrow') {
          dispatchAction({
            type: Action.RelationDrawMove,
            data: { id, pointerInViewportCoords: clientCoords },
          })
        }
      }

      const handlePointerUp = (_e: MouseEvent | TouchEvent) => {
        window.removeEventListener('mousemove', handlePointerMove)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchend', handlePointerUp)

        if (intent === 'arrow') {
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
        }

        intent = ''

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

      return {
        handlePointerDown: (e: MouseEvent | TouchEvent) => {
          const clientCoords = getUnifiedClientCoords(e)
          lastClientCoords = clientCoords

          if (e instanceof MouseEvent) {
            /** Reject non-primary button. */
            if (e.button !== 0) {
              /** Prevent focus if InteractionMode is not Focusing. */
              if (modeRef.current !== InteractionMode.Focusing)
                e.preventDefault()
              if (
                e.button === 2 &&
                modeRef.current !== InteractionMode.Focusing
              ) {
                dispatchAction({
                  type: Action.ContextMenuOpen,
                  data: {
                    pointerInViewportCoords: clientCoords,
                  },
                })
              }
              return
            }
          }

          const resizerRect = resizerRef.current.getBoundingClientRect()
          const arrowTriggerRect = arrowTriggerRef.current.getBoundingClientRect()

          if (isPointInRect(clientCoords, resizerRect)) intent = 'resize'
          else if (isPointInRect(clientCoords, arrowTriggerRect)) {
            intent = 'arrow'
            dispatchAction({
              type: Action.RelationDrawStart,
              data: { id, pointerInViewportCoords: clientCoords },
            })
          } else if (modeRef.current !== InteractionMode.Focusing) {
            intent = 'move'
            dispatchAction({
              type: Action.BlockMoveStart,
              data: { id, pointerInViewportCoords: clientCoords },
            })
          }

          window.addEventListener('mousemove', handlePointerMove)
          window.addEventListener('touchmove', handlePointerMove)
          window.addEventListener('mouseup', handlePointerUp)
          window.addEventListener('touchend', handlePointerUp)
        },
      }
    })()

    function preventContextMenu(e: MouseEvent) {
      if (modeRef.current !== InteractionMode.Focusing) e.preventDefault()
    }
    const blockEl = blockRef.current

    blockEl.addEventListener('mousedown', gestureDetector.handlePointerDown)
    blockEl.addEventListener('touchstart', gestureDetector.handlePointerDown)
    /** Disable system since we're showing our own. */
    blockEl.addEventListener('contextmenu', preventContextMenu)

    return () => {
      blockEl.removeEventListener(
        'mousedown',
        gestureDetector.handlePointerDown
      )
      blockEl.removeEventListener(
        'touchstart',
        gestureDetector.handlePointerDown
      )
      blockEl.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [id, dispatchAction])

  const blockClassName = useMemo(() => {
    return classes(
      className,
      styles.Block,
      selected ? styles['Block--Selected'] : undefined,
      mode === InteractionMode.Focusing ? styles['Block--Focusing'] : undefined,
      mode === InteractionMode.Moving ? styles['Block--Moving'] : undefined
    )
  }, [mode, selected, className])

  return (
    <>
      <div ref={blockRef} className={blockClassName} data-color={color}>
        {children}
        <div
          ref={resizerRef}
          style={{
            position: 'absolute',
            top: iconSize + 2,
            right: 0,
            bottom: 0,
            width: 14,
            cursor: 'ew-resize',
          }}
        />
        {blink && <div className="Blink" />}
        <div
          className="ActionBtn"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: iconSize,
            height: iconSize,
            padding: 2,
          }}
          onClick={() => {
            dispatchAction({
              type: Action.BlockOpenAsCanvas,
              data: { id: conceptId },
            })
          }}>
          <OpenInFull />
        </div>
        <div
          ref={arrowTriggerRef}
          className="ActionBtn"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: iconSize,
            height: iconSize,
            padding: 1,
          }}>
          <ArrowNorthEast />
        </div>
        {highlighted && <div className={styles.HighlightOverlay} />}
      </div>
    </>
  )
}
