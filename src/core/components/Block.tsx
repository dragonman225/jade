import * as React from 'react'
import { useRef, useEffect, useMemo } from 'react'
import { classes } from 'typestyle'

import { Cross } from './Icons/Cross'
import { Expand } from './Icons/Expand'
import { styles } from './Block.styles'
import { getUnifiedClientCoords, isPointInRect, vecSub } from '../utils'
import {
  deleteElement,
  setElement,
  setElementRect,
} from '../utils/element-pool'
import { Action, Actions } from '../store/actions'
import { BlockId, ConceptId, InteractionMode } from '../interfaces'

interface Props {
  id: BlockId
  conceptId: ConceptId
  mode: InteractionMode
  selected: boolean
  highlighted: boolean
  blink: boolean
  dispatchAction: (action: Actions) => void
  className?: string
  children?: React.ReactNode
}

export function Block(props: Props): JSX.Element {
  const {
    id,
    conceptId,
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
  const modeRef = useRef<InteractionMode>(mode)

  useEffect(() => {
    setElement(id, blockRef.current)
    setElementRect(id, blockRef.current.getBoundingClientRect())

    return () => deleteElement(id)
  }, [id])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const gestureDetector = (() => {
      let intent: '' | 'move' | 'resize' = ''
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
            data: { id, pointerInViewportCoords: clientCoords },
          })
          dispatchAction({
            type: Action.BlockSetMode,
            data: { id, mode: InteractionMode.Moving },
          })
        }
      }

      const handlePointerUp = () => {
        window.removeEventListener('mousemove', handlePointerMove)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchend', handlePointerUp)

        intent = ''
        lastClientCoords = { x: 0, y: 0 }

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
          if (e instanceof MouseEvent) {
            /** Reject non-primary button. */
            if (e.button !== 0) return
          }

          const clientCoords = getUnifiedClientCoords(e)
          lastClientCoords = clientCoords

          const resizerRect = resizerRef.current.getBoundingClientRect()

          if (isPointInRect(clientCoords, resizerRect)) intent = 'resize'
          else if (modeRef.current !== InteractionMode.Focusing) {
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

    const blockEl = blockRef.current

    blockEl.addEventListener('mousedown', gestureDetector.handlePointerDown)
    blockEl.addEventListener('touchstart', gestureDetector.handlePointerDown)

    return () => {
      blockEl.removeEventListener(
        'mousedown',
        gestureDetector.handlePointerDown
      )
      blockEl.removeEventListener(
        'touchstart',
        gestureDetector.handlePointerDown
      )
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
      <div ref={blockRef} className={blockClassName}>
        {children}
        <div
          ref={resizerRef}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 20,
            cursor: 'ew-resize',
          }}
        />
        {blink && <div className="Blink" />}
        <div
          className="ActionBtn ActionBtn--Green"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 20,
            height: 20,
            padding: 4,
          }}
          onClick={() => {
            dispatchAction({
              type: Action.BlockOpenAsCanvas,
              data: { id: conceptId },
            })
          }}>
          <Expand />
        </div>
        <div
          className="ActionBtn ActionBtn--Red"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 20,
            height: 20,
            padding: 4,
          }}
          onClick={() => {
            dispatchAction({
              type: Action.BlockRemove,
              data: { id },
            })
          }}>
          <Cross />
        </div>
        {highlighted && <div className={styles.HighlightOverlay} />}
      </div>
    </>
  )
}
