import * as React from 'react'
import { useRef, useEffect } from 'react'

import { getUnifiedClientCoords, vecSub } from '../utils'
import { SelectionBox } from './SelectionBox'
import { ViewObject } from './ViewObject'
import { Action, Actions } from '../store/actions'
import { BlockInstance, Box, PositionType, Vec2 } from '../interfaces'

interface Props {
  focus: Vec2
  scale: number
  blocks: BlockInstance[]
  selecting: boolean
  selectionBox: Box
  renderBlock: (block: BlockInstance) => JSX.Element
  dispatchAction: (action: Actions) => void
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
          type: Action.CameraScaleDelta,
          data: {
            focus: { x: e.clientX, y: e.clientY },
            wheelDelta: e.deltaY,
          },
        })
      } else {
        dispatchAction({
          type: Action.CameraMoveDelta,
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
          type: Action.ConceptCreate,
          data: {
            position: viewportCoords,
          },
        })
      }
    }

    const inputDetector = (() => {
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
                  type: Action.SelectionBoxSetStart,
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
              type: Action.CameraMoveDelta,
              data: movement,
            })
          } else if (selecting) {
            dispatchAction({
              type: Action.SelectionBoxSetEnd,
              data: clientCoords,
            })
          }

          lastClientCoords = clientCoords
        },
        handlePointerUp: () => {
          panning = false
          if (selecting) {
            dispatchAction({
              type: Action.SelectionBoxClear,
            })
            selecting = false
          }

          lastClientCoords = { x: 0, y: 0 }
        },
        handleKeydown: (e: KeyboardEvent) => {
          if (e.altKey && e.key === 'n') {
            dispatchAction({
              type: Action.ConceptCreate,
              data: {
                position: lastClientCoords,
              },
            })
          } else if (e.key === 'Delete') {
            dispatchAction({
              type: Action.BlockRemoveSelected,
            })
          }
        },
      }
    })()

    const cameraEl = cameraElRef.current
    cameraEl.addEventListener('wheel', handleWheel)
    cameraEl.addEventListener('dblclick', handleDoubleClick)
    cameraEl.addEventListener('mousedown', inputDetector.handlePointerDown)
    window.addEventListener('mousemove', inputDetector.handlePointerMove)
    cameraEl.addEventListener('mouseup', inputDetector.handlePointerUp)
    cameraEl.addEventListener('touchstart', inputDetector.handlePointerDown)
    window.addEventListener('touchmove', inputDetector.handlePointerMove)
    cameraEl.addEventListener('touchend', inputDetector.handlePointerUp)
    window.addEventListener('keydown', inputDetector.handleKeydown)

    return () => {
      cameraEl.removeEventListener('wheel', handleWheel)
      cameraEl.removeEventListener('dblclick', handleDoubleClick)
      cameraEl.removeEventListener('mousedown', inputDetector.handlePointerDown)
      window.removeEventListener('mousemove', inputDetector.handlePointerMove)
      cameraEl.removeEventListener('mouseup', inputDetector.handlePointerUp)
      cameraEl.removeEventListener(
        'touchstart',
        inputDetector.handlePointerDown
      )
      window.removeEventListener('touchmove', inputDetector.handlePointerMove)
      cameraEl.removeEventListener('touchend', inputDetector.handlePointerUp)
      window.removeEventListener('keydown', inputDetector.handleKeydown)
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
            transform: `translate3d(${-focus.x * scale}px, ${
              -focus.y * scale
            }px, 0px) scale(${scale})`,
            // TODO: Use `use-spring` to make proper animations.
            transition: 'transform 50ms ease-in-out 0s',
          }}>
          {blocks
            .filter(
              b =>
                b.posType === PositionType.Normal ||
                typeof b.posType === 'undefined'
            )
            .map(b => {
              const key = `ViewObject-${b.id}`

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
                transform: `translate3d(${selectionBox.x}px, ${selectionBox.y}px, 0px)`,
              }}
            />
          )}
        </div>
      </div>
      {blocks
        .filter(b => b.posType !== PositionType.Normal)
        .map(b => {
          const key = `ViewObject-${b.id}`

          return (
            <ViewObject key={key} posType={b.posType} pos={b.pos} size={b.size}>
              {renderBlock(b)}
            </ViewObject>
          )
        })}
    </>
  )
}
