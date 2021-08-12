import * as React from 'react'
import { useRef, useEffect } from 'react'
import { classes } from 'typestyle'

import { Cross } from './icons/Cross'
import { Expand } from './icons/Expand'
import { BlockStyles } from './Block.styles'
import { getUnifiedClientCoords, isPointInRect, vecSub } from '../utils'
import { deleteElement, setElement } from './ElementPool'
import { Action, Actions } from '../store/actions'
import { BlockInstance, Concept, InteractionMode } from '../interfaces'

interface Props {
  debug: boolean
  className?: string
  block: BlockInstance
  dispatchAction: (action: Actions) => void
  children?: React.ReactNode
}

export function Block(props: Props): JSX.Element {
  const { debug, className, block, dispatchAction } = props

  const concept = block.concept
  const blockRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const blockStateRef = useRef<BlockInstance>(block)

  const setMode = (mode: InteractionMode) => {
    dispatchAction({
      type: Action.BlockSetMode,
      data: {
        id: block.id,
        mode,
      },
    })
  }

  useEffect(() => {
    setElement(block.id, blockRef.current)

    return () => deleteElement(block.id)
  }, [block.id])

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
          dispatchAction({
            type: Action.BlockResize,
            data: {
              id: block.id,
              movementInViewportCoords: movement,
            },
          })
          setMode(InteractionMode.Resizing)
        } else if (intent === 'move') {
          dispatchAction({
            type: Action.BlockMove,
            data: {
              id: block.id,
              pointerInViewportCoords: clientCoords,
            },
          })
          setMode(InteractionMode.Moving)
        }
      }

      const handlePointerUp = () => {
        window.removeEventListener('mousemove', handlePointerMove)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchend', handlePointerUp)

        intent = ''
        lastClientCoords = { x: 0, y: 0 }

        const mode = blockStateRef.current.mode
        if (mode === InteractionMode.Moving)
          dispatchAction({ type: Action.BlockMoveEnd })

        /** "Focusing" is controlled by the concept display. */
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
          else if (blockStateRef.current.mode !== InteractionMode.Focusing) {
            intent = 'move'
            dispatchAction({
              type: Action.BlockMoveStart,
              data: { id: block.id, pointerInViewportCoords: clientCoords },
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
  }, [])

  return (
    <div
      ref={blockRef}
      className={classes(
        className,
        BlockStyles.Block,
        block.selected ? BlockStyles['Block--Selected'] : undefined,
        block.mode === InteractionMode.Focusing
          ? BlockStyles['Block--Focusing']
          : undefined,
        block.mode === InteractionMode.Moving
          ? BlockStyles['Block--Moving']
          : undefined
      )}>
      {props.children}
      {debug && (
        <div className={BlockStyles.DebugLabel}>
          id: {block.id}
          <br />
          mode: {block.mode}
          <br />
          posType: {block.posType}
          <br />
          pos:{' '}
          {`{ x: ${block.pos.x.toFixed(2)}, y: ${block.pos.y.toFixed(2)} }`}
          <br />
          selected: {block.selected ? 'true' : 'false'}
          <br />
          createdTime: {block.createdTime}
          <br />
          lastEditedTime: {block.lastEditedTime}
          <br />
          concept.id: {concept.id}
          <br />
          concept.createdTime: {concept.createdTime}
          <br />
          concept.lastEditedTime: {concept.lastEditedTime}
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
      {Concept.isHighOrder(concept) && <div className="HighOrderMark" />}
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
            type: Action.BlockRemove,
            data: { id: block.id },
          })
        }}>
        <Cross />
      </div>
    </div>
  )
}
