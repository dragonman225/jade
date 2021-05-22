import * as React from 'react'
import { useRef, useEffect } from 'react'
import { stylesheet } from 'typestyle'

import { factoryRegistry } from '../factories'
import { IconCross } from './component/IconCross'
import { IconExpand } from './component/IconExpand'
import { getUnifiedClientCoords, isPointInRect, vecSub } from './lib/utils'
import {
  ConceptDetail,
  Block as BlockState,
  InteractionMode,
  State4,
  DatabaseInterface,
} from './interfaces'
import { Action } from './reducer'
import { PubSub } from './lib/pubsub'

const styles = stylesheet({
  Block: {
    background: 'white',
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
})

interface Props {
  block: BlockState
  conceptDetail: ConceptDetail
  dispatchAction: React.Dispatch<Action>
  scheduleActionForAnimationFrame: (action: Action) => void
  messageBus: PubSub
  state: State4
  db: DatabaseInterface
  createOverlay: (children: React.ReactNode) => React.ReactPortal
}

export function Block(props: Props): JSX.Element {
  const {
    block,
    conceptDetail,
    dispatchAction,
    scheduleActionForAnimationFrame,
    messageBus,
    state,
    db,
    createOverlay,
  } = props
  const subConcept = conceptDetail.concept
  const blockRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const blockStateRef = useRef<BlockState>(block)

  useEffect(() => {
    blockStateRef.current = block
  }, [block])

  useEffect(() => {
    console.log('update block listener')
    const setMode = (mode: InteractionMode) => {
      dispatchAction({
        type: 'block::change',
        data: {
          ...blockStateRef.current,
          mode,
        },
      })
    }

    const gestureDetector = (() => {
      let intent: '' | 'move' | 'resize' = ''
      let lastClientCoords = { x: 0, y: 0 }

      return {
        handlePointerDown: (e: MouseEvent | TouchEvent) => {
          const clientCoords = getUnifiedClientCoords(e)
          lastClientCoords = clientCoords

          const resizerRect = resizerRef.current.getBoundingClientRect()

          if (isPointInRect(clientCoords, resizerRect)) intent = 'resize'
          else if (blockStateRef.current.mode !== InteractionMode.Focusing)
            intent = 'move'

          const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const clientCoords = getUnifiedClientCoords(e)
            const movement = vecSub(clientCoords, lastClientCoords)
            lastClientCoords = clientCoords

            if (intent === 'resize') {
              scheduleActionForAnimationFrame({
                type: 'ref::resize',
                data: {
                  id: conceptDetail.link.id,
                  movementInViewportCoords: movement,
                },
              })
              setMode(InteractionMode.Resizing)
            } else if (intent === 'move') {
              scheduleActionForAnimationFrame({
                type: 'ref::move',
                data: {
                  id: conceptDetail.link.id,
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
  }, [blockRef.current])

  return (
    <div
      ref={blockRef}
      className={styles.Block}
      style={{
        width: conceptDetail.link.width,
        /** Set to "absolute" so blocks can overlap. */
        position: 'absolute',
        transformOrigin: 'top left',
        transform: `translate(${conceptDetail.link.position.x}px, ${conceptDetail.link.position.y}px)`,
      }}>
      {factoryRegistry.createConceptDisplay(subConcept.summary.type, {
        readOnly: block.mode === InteractionMode.Moving,
        viewMode: 'Block',
        physicalInfo: {
          origin: { type: 'TL', top: 0, left: 0 },
          position: conceptDetail.link.position,
          width: conceptDetail.link.width,
        },
        content: subConcept.summary.data,
        messageBus,
        app: {
          state,
          dispatch: dispatchAction,
        },
        factoryRegistry,
        database: db,
        onChange: content => {
          dispatchAction({
            type: 'concept::datachange',
            data: {
              id: subConcept.id,
              type: subConcept.summary.type,
              content,
            },
          })
        },
        onReplace: type => {
          dispatchAction({
            type: 'concept::datachange',
            data: {
              id: subConcept.id,
              type,
              content: { initialized: false },
            },
          })
        },
        onInteractionStart: () => {
          dispatchAction({
            type: 'block::change',
            data: { ...block, mode: InteractionMode.Focusing },
          })
        },
        onInteractionEnd: () => {
          dispatchAction({
            type: 'block::change',
            data: { ...block, mode: InteractionMode.Idle },
          })
        },
        createOverlay,
      })}
      <span
        style={{
          position: 'absolute',
          color: 'blueviolet',
          bottom: 0,
          left: 0,
        }}>
        {block.mode}
      </span>
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
          if (subConcept.id !== state.viewingConcept.id) {
            dispatchAction({
              type: 'navigation::expand',
              data: { id: subConcept.id },
            })
          }
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
            data: { id: conceptDetail.link.id },
          })
        }}>
        <IconCross />
      </div>
    </div>
  )
}
