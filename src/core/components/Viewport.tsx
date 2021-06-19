import * as React from 'react'
import { useRef, useEffect } from 'react'

import { getUnifiedClientCoords, vecSub } from '../utils'
import { Block as BlockState, Box, PositionType, Vec2 } from '../interfaces'
import { Action } from '../reducer'
import { SelectionBox } from './SelectionBox'
import { ViewObject } from './ViewObject'

interface Props {
  focus: Vec2
  scale: number
  blocks: BlockState[]
  selecting: boolean
  selectionBox: Box
  renderBlock: (block: BlockState) => JSX.Element
  dispatchAction: React.Dispatch<Action>
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
        dispatchAction({
          type: 'cam::scaledelta',
          data: {
            focus: { x: e.clientX, y: e.clientY },
            wheelDelta: e.deltaY,
          },
        })
      } else {
        dispatchAction({
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
                dispatchAction({
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
            dispatchAction({
              type: 'cam::movedelta',
              data: movement,
            })
          } else if (selecting) {
            dispatchAction({
              type: 'selectionbox::setend',
              data: clientCoords,
            })
          }

          lastClientCoords = clientCoords
        },
        handlePointerUp: () => {
          panning = false
          if (selecting) {
            dispatchAction({
              type: 'selectionbox::clear',
            })
            selecting = false
          }

          lastClientCoords = { x: 0, y: 0 }
        },
      }
    })()

    const cameraEl = cameraElRef.current
    cameraEl.addEventListener('wheel', handleWheel)
    cameraEl.addEventListener('dblclick', handleDoubleClick)
    cameraEl.addEventListener('mousedown', panDetector.handlePointerDown)
    window.addEventListener('mousemove', panDetector.handlePointerMove)
    cameraEl.addEventListener('mouseup', panDetector.handlePointerUp)
    cameraEl.addEventListener('touchstart', panDetector.handlePointerDown)
    window.addEventListener('touchmove', panDetector.handlePointerMove)
    cameraEl.addEventListener('touchend', panDetector.handlePointerUp)

    return () => {
      cameraEl.removeEventListener('wheel', handleWheel)
      cameraEl.removeEventListener('dblclick', handleDoubleClick)
      cameraEl.removeEventListener('mousedown', panDetector.handlePointerDown)
      window.removeEventListener('mousemove', panDetector.handlePointerMove)
      cameraEl.removeEventListener('mouseup', panDetector.handlePointerUp)
      cameraEl.removeEventListener('touchstart', panDetector.handlePointerDown)
      window.removeEventListener('touchmove', panDetector.handlePointerMove)
      cameraEl.removeEventListener('touchend', panDetector.handlePointerUp)
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
            .map(b => {
              const key = `ViewObject-${b.refId}`

              return (
                <ViewObject
                  key={key}
                  posType={b.posType}
                  pos={b.pos}
                  size={b.size}>
                  {renderBlock(b)}
                </ViewObject>
              )
            })}
          {selecting && (
            <SelectionBox
              key="SelectionBox"
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
      {blocks
        .filter(b => b.posType !== PositionType.Normal)
        .map(b => {
          const key = `ViewObject-${b.refId}`

          return (
            <ViewObject key={key} posType={b.posType} pos={b.pos} size={b.size}>
              {renderBlock(b)}
            </ViewObject>
          )
        })}
    </>
  )
}
