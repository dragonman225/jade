import * as React from 'react'
import { useRef, useEffect } from 'react'

import { getUnifiedClientCoords, vecSub } from '../lib/utils'
import { Block as BlockState, Box, PositionType, Vec2 } from '../interfaces'
import { Action } from '../reducer'
import { SelectionBox } from './SelectionBox'

interface Props {
  focus: Vec2
  scale: number
  blocks: BlockState[]
  selecting: boolean
  selectionBox: Box
  renderBlock: (block: BlockState) => JSX.Element
  dispatchAction: React.Dispatch<Action>
  scheduleActionForAnimationFrame: (action: Action) => void
}

export function Viewport(props: Props): JSX.Element {
  const {
    focus,
    scale,
    blocks,
    selecting,
    selectionBox,
    renderBlock,
    dispatchAction,
    scheduleActionForAnimationFrame,
  } = props

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
        scheduleActionForAnimationFrame({
          type: 'cam::scaledelta',
          data: {
            focus: { x: e.clientX, y: e.clientY },
            wheelDelta: e.deltaY,
          },
        })
      } else {
        scheduleActionForAnimationFrame({
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
      let selecting = false
      let lastClientCoords = { x: 0, y: 0 }

      return {
        handlePointerDown: (e: MouseEvent | TouchEvent) => {
          const clientCoords = getUnifiedClientCoords(e)

          if (e instanceof MouseEvent) {
            /** Interacting with a mouse. */
            if (e.button === 0) {
              if (e.target === cameraElRef.current) {
                /** Primary button, target not being a Block -> Start selection box. */
                scheduleActionForAnimationFrame({
                  type: 'selectionbox::setstart',
                  data: clientCoords,
                })

                selecting = true
              }
            } else if (e.button === 1) {
              /** Middle button, target being anything -> Start moving camera. */
              panning = true
            }
          } else {
            /** Interacting with a touch device. */
            /** TODO: Start selection box when holding with one finger for a while. */
            if (e.target === cameraElRef.current && e.touches.length === 2) {
              /** Two fingers, target not being a Block -> Start moving camera. */
              panning = true
            }
          }

          lastClientCoords = clientCoords
        },
        handlePointerMove: (e: MouseEvent | TouchEvent) => {
          const clientCoords = getUnifiedClientCoords(e)

          if (panning) {
            const movement = vecSub(clientCoords, lastClientCoords)
            scheduleActionForAnimationFrame({
              type: 'cam::movedelta',
              data: movement,
            })
          } else if (selecting) {
            scheduleActionForAnimationFrame({
              type: 'selectionbox::setend',
              data: clientCoords,
            })
          }

          lastClientCoords = clientCoords
        },
        handlePointerUp: () => {
          panning = false
          if (selecting) {
            scheduleActionForAnimationFrame({
              type: 'selectionbox::clear',
            })
            selecting = false
          }

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
              b =>
                b.posType === PositionType.Normal ||
                typeof b.posType === 'undefined'
            )
            .map(renderBlock)}
          {selecting && (
            <SelectionBox
              style={{
                width: selectionBox.w,
                height: selectionBox.h,
                /** Set to "absolute" so blocks can overlap. */
                position: 'absolute',
                transformOrigin: 'top left',
                transform: `translate(${selectionBox.x}px, ${selectionBox.y}px)`,
              }}
            />
          )}
        </div>
      </div>
      {blocks.filter(b => b.posType === PositionType.PinnedTL).map(renderBlock)}
    </>
  )
}
