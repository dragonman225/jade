import * as React from 'react'
import { useRef, useEffect } from 'react'
import { stylesheet } from 'typestyle'

import { IconCross } from './component/IconCross'
import { IconExpand } from './component/IconExpand'
import { getUnifiedClientCoords, isPointInRect, vecSub } from './lib/utils'
import { Block as BlockState, InteractionMode } from './interfaces'
import { Action } from './reducer'

const styles = stylesheet({
  Block: {
    background: 'white',
    borderRadius: '.3rem',
    $nest: {
      '& > .ActionBtn': {
        opacity: 0,
        transition: '0.1s opacity ease-in-out, 0.1s fill ease-in-out',
        fill: 'silver',
        cursor: 'pointer',
        borderRadius: '.3rem',
        $nest: {
          '&:hover': {
            background: '#eee',
          },
        },
      },
      '&:hover > .ActionBtn': {
        opacity: 1,
      },
      '& > .ActionBtn--Red:hover': {
        fill: 'lightcoral',
      },
      '& > .ActionBtn--Green:hover': {
        fill: 'mediumaquamarine',
      },
    },
  },
  Debug: {
    position: 'absolute',
    color: 'blueviolet',
    top: 0,
    left: '100%',
    width: 300,
    background: 'rgba(211, 211, 211, 0.8)',
    fontSize: '0.6rem',
    fontFamily: 'monospace',
  },
})

interface Props {
  block: BlockState
  dispatchAction: React.Dispatch<Action>
  scheduleActionForAnimationFrame: (action: Action) => void
  children?: React.ReactNode
}

export function Block(props: Props): JSX.Element {
  const { block, dispatchAction, scheduleActionForAnimationFrame } = props

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
      className={styles.Block}
      style={{
        width: block.size.w,
        height: block.size.h,
        /** Set to "absolute" so blocks can overlap. */
        position: 'absolute',
        transformOrigin: 'top left',
        transform: `translate(${block.pos.x}px, ${block.pos.y}px)`,
      }}>
      {props.children}
      <div className={styles.Debug}>
        id: {block.refId}
        <br />
        mode: {block.mode}
        <br />
        posType: {block.posType}
        <br />
        pos: {`{ x: ${block.pos.x.toFixed(2)}, y: ${block.pos.y.toFixed(2)} }`}
      </div>
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
        <IconExpand />
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
        <IconCross />
      </div>
    </div>
  )
}
