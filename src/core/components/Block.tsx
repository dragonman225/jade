import * as React from 'react'
import { useRef, useEffect } from 'react'
import { classes } from 'typestyle'

import { Cross } from './icons/Cross'
import { Expand } from './icons/Expand'
import { BlockStyles } from './Block.styles'
import { DebugLabelStyle } from '../styles/DebugLabel'
import { getUnifiedClientCoords, isPointInRect, vecSub } from '../lib/utils'
import { Block as BlockState, InteractionMode } from '../interfaces'
import { Action } from '../reducer'

interface Props {
  debug: boolean
  block: BlockState
  dispatchAction: React.Dispatch<Action>
  scheduleActionForAnimationFrame: (action: Action) => void
  children?: React.ReactNode
}

export function Block(props: Props): JSX.Element {
  const {
    debug,
    block,
    dispatchAction,
    scheduleActionForAnimationFrame,
  } = props

  const concept = block.concept
  const blockRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const blockStateRef = useRef<BlockState>(block)

  const setMode = (mode: InteractionMode) => {
    dispatchAction({
      type: 'block::change',
      data: {
        id: block.refId,
        changes: {
          mode,
        },
      },
    })
  }

  useEffect(() => {
    blockStateRef.current = block
  }, [block])

  useEffect(() => {
    const gestureDetector = (() => {
      let intent: '' | 'move' | 'resize' = ''
      let lastClientCoords = { x: 0, y: 0 }

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const clientCoords = getUnifiedClientCoords(e)
        const movement = vecSub(clientCoords, lastClientCoords)
        lastClientCoords = clientCoords

        if (intent === 'resize') {
          scheduleActionForAnimationFrame({
            type: 'ref::resize',
            data: {
              id: block.refId,
              movementInViewportCoords: movement,
            },
          })
          setMode(InteractionMode.Resizing)
        } else if (intent === 'move') {
          scheduleActionForAnimationFrame({
            type: 'ref::move',
            data: {
              id: block.refId,
              movementInViewportCoords: movement,
            },
          })
          setMode(InteractionMode.Moving)
        }
      }

      const handlePointerUp = () => {
        document.removeEventListener('mousemove', handlePointerMove)
        document.removeEventListener('touchmove', handlePointerMove)
        document.removeEventListener('mouseup', handlePointerUp)
        document.removeEventListener('touchend', handlePointerUp)

        intent = ''
        lastClientCoords = { x: 0, y: 0 }

        /** "Focusing" is controlled by the concept display. */
        const mode = blockStateRef.current.mode
        if (
          mode === InteractionMode.Moving ||
          mode === InteractionMode.Resizing
        )
          setMode(InteractionMode.Idle)
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
          else if (blockStateRef.current.mode !== InteractionMode.Focusing)
            intent = 'move'

          document.addEventListener('mousemove', handlePointerMove)
          document.addEventListener('touchmove', handlePointerMove)
          document.addEventListener('mouseup', handlePointerUp)
          document.addEventListener('touchend', handlePointerUp)
        },
      }
    })()

    blockRef.current.addEventListener(
      'mousedown',
      gestureDetector.handlePointerDown
    )
    blockRef.current.addEventListener(
      'touchstart',
      gestureDetector.handlePointerDown
    )

    return () => {
      blockRef.current.removeEventListener(
        'mousedown',
        gestureDetector.handlePointerDown
      )
      blockRef.current.removeEventListener(
        'touchstart',
        gestureDetector.handlePointerDown
      )
    }
  }, [])

  return (
    <div
      ref={blockRef}
      className={classes(
        BlockStyles.Block,
        block.selected ? BlockStyles['Block--Selected'] : undefined
      )}>
      {props.children}
      {debug && (
        <div className={DebugLabelStyle}>
          id: {block.refId}
          <br />
          mode: {block.mode}
          <br />
          posType: {block.posType}
          <br />
          pos:{' '}
          {`{ x: ${block.pos.x.toFixed(2)}, y: ${block.pos.y.toFixed(2)} }`}
          <br />
          selected: {block.selected ? 'true' : 'false'}
        </div>
      )}
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
            type: 'navigation::expand',
            data: { id: concept.id },
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
            type: 'ref::remove',
            data: { id: block.refId },
          })
        }}>
        <Cross />
      </div>
    </div>
  )
}
