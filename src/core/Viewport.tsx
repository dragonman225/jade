import * as React from 'react'
import { useRef, useEffect, useCallback } from 'react'

import { Block } from './Block'
import { useAnimationFrame } from './useAnimationFrame'
import { getUnifiedClientCoords, vecAdd, vecSub } from './lib/utils'
import {
  Block as BlockState,
  DatabaseInterface,
  FactoryRegistry,
  Vec2,
} from './interfaces'
import { Action } from './reducer'
import { PubSub } from './lib/pubsub'

interface Props {
  focus: Vec2
  scale: number
  blocks: BlockState[]
  dispatchAction: React.Dispatch<Action>
  factoryRegistry: FactoryRegistry
  // db: DatabaseInterface
  // createOverlay: (children: React.ReactNode) => React.ReactPortal
  // messageBus: PubSub
}

export function Viewport(props: Props): JSX.Element {
  const {
    focus,
    scale,
    blocks,
    dispatchAction,
    factoryRegistry,
    // db,
    // createOverlay,
    // messageBus,
  } = props

  const actionQueueRef = useRef<Action[]>([])
  useAnimationFrame(() => {
    const aggregatedMoveActions: { [key: string]: Action } = {}
    actionQueueRef.current.forEach(a => {
      if (a.type === 'ref::move') {
        if (aggregatedMoveActions[a.data.id]) {
          aggregatedMoveActions[a.data.id] = {
            ...aggregatedMoveActions[a.data.id],
            movementInViewportCoords: vecAdd(
              aggregatedMoveActions[a.data.id].movementInViewportCoords,
              a.data.movementInViewportCoords
            ),
          }
        } else {
          aggregatedMoveActions[a.data.id] = a.data
        }
      }
    })

    Object.values(aggregatedMoveActions).forEach(a =>
      dispatchAction({
        type: 'ref::move',
        data: a,
      })
    )
    actionQueueRef.current
      .filter(a => a.type !== 'ref::move')
      .forEach(action => dispatchAction(action))
    actionQueueRef.current = []
  })

  /**
   * React set `{ passive: true }` for its real WheelEvent handler, making
   * it unable to call `event.preventDefault()` to disable browser's
   * "Ctrl + Wheel" zoom feature in the handler set with `onWheel` prop,
   * so we have to fallback to the native API.
   *
   * If we try to call `event.preventDefault()` inside the handler set
   * with `onWheel` prop, we'll get the error:
   * "Unable to preventDefault inside passive event listener due to target
   * being treated as passive."
   */
  const cameraElRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        actionQueueRef.current.push({
          type: 'cam::scaledelta',
          data: {
            focus: { x: e.clientX, y: e.clientY },
            wheelDelta: e.deltaY,
          },
        })
      } else {
        actionQueueRef.current.push({
          type: 'cam::movedelta',
          data: {
            x: -e.deltaX,
            y: -e.deltaY,
          },
        })
      }
    }

    const handleDoubleClick = (e: MouseEvent) => {
      if (e.target === cameraElRef.current) {
        const viewportCoords: Vec2 = { x: e.clientX, y: e.clientY }
        dispatchAction({
          type: 'concept::create',
          data: {
            position: viewportCoords,
          },
        })
      }
    }

    const panDetector = (() => {
      let panning = false
      let lastClientCoords = { x: 0, y: 0 }

      return {
        handlePointerDown: (e: MouseEvent | TouchEvent) => {
          if (e instanceof MouseEvent) {
            if (e.button === 0) {
              /** Using primary button requires starting from an empty area. */
              if (e.target !== cameraElRef.current) return
            } else if (e.button !== 1) {
              /** Using wheel button allows starting from anywhere. */
              return
            }
          } else {
            /** Ignore touches with more than one point. */
            if (e.target !== cameraElRef.current || e.touches.length > 1) return
          }

          panning = true
          lastClientCoords = getUnifiedClientCoords(e)
        },
        handlePointerMove: (e: MouseEvent | TouchEvent) => {
          if (panning) {
            const clientCoords = getUnifiedClientCoords(e)
            const movement = vecSub(clientCoords, lastClientCoords)
            lastClientCoords = clientCoords
            actionQueueRef.current.push({
              type: 'cam::movedelta',
              data: movement,
            })
          }
        },
        handlePointerUp: () => {
          panning = false
          lastClientCoords = { x: 0, y: 0 }
        },
      }
    })()

    cameraElRef.current.addEventListener('wheel', handleWheel)
    cameraElRef.current.addEventListener('dblclick', handleDoubleClick)
    cameraElRef.current.addEventListener(
      'mousedown',
      panDetector.handlePointerDown
    )
    cameraElRef.current.addEventListener(
      'mousemove',
      panDetector.handlePointerMove
    )
    cameraElRef.current.addEventListener('mouseup', panDetector.handlePointerUp)
    cameraElRef.current.addEventListener(
      'touchstart',
      panDetector.handlePointerDown
    )
    cameraElRef.current.addEventListener(
      'touchmove',
      panDetector.handlePointerMove
    )
    cameraElRef.current.addEventListener(
      'touchend',
      panDetector.handlePointerUp
    )

    return () => {
      cameraElRef.current.removeEventListener('wheel', handleWheel)
      cameraElRef.current.removeEventListener('dblclick', handleDoubleClick)
      cameraElRef.current.removeEventListener(
        'mousedown',
        panDetector.handlePointerDown
      )
      cameraElRef.current.removeEventListener(
        'mousemove',
        panDetector.handlePointerMove
      )
      cameraElRef.current.removeEventListener(
        'mouseup',
        panDetector.handlePointerUp
      )
      cameraElRef.current.removeEventListener(
        'touchstart',
        panDetector.handlePointerDown
      )
      cameraElRef.current.removeEventListener(
        'touchmove',
        panDetector.handlePointerMove
      )
      cameraElRef.current.removeEventListener(
        'touchend',
        panDetector.handlePointerUp
      )
    }
  }, [])

  const scheduleActionForAnimationFrame = useCallback(
    (action: Action) => actionQueueRef.current.push(action),
    []
  )

  return (
    <>
      <div
        /** Fill the viewport to listen for events. */
        ref={cameraElRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}>
        <div
          /** Act as the origin of the environment. */
          style={{
            width: 0,
            height: 0,
            transformOrigin: 'top left',
            transform: `translate(${-focus.x * scale}px, ${
              -focus.y * scale
            }px) scale(${scale})`,
          }}>
          {blocks
            .filter(
              b => !factoryRegistry.getFactory(b.concept.summary.type)?.isTool
            )
            .map(block => {
              const key = 'Block-' + block.refId
              return (
                <Block
                  key={key}
                  block={block}
                  // createOverlay={createOverlay}
                  // db={db}
                  dispatchAction={dispatchAction}
                  // messageBus={messageBus}
                  scheduleActionForAnimationFrame={
                    scheduleActionForAnimationFrame
                  }
                  // state={state}
                />
              )
            })}
        </div>
      </div>
      {blocks
        .filter(b => factoryRegistry.getFactory(b.concept.summary.type)?.isTool)
        .map(block => {
          const key = 'Block-' + block.refId
          return (
            <Block
              key={key}
              block={block}
              // createOverlay={createOverlay}
              // db={db}
              dispatchAction={dispatchAction}
              // messageBus={messageBus}
              scheduleActionForAnimationFrame={scheduleActionForAnimationFrame}
              // state={state}
            />
          )
        })}
    </>
  )
}
