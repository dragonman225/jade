/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useEffect, useReducer, useMemo, useCallback, useRef } from 'react'
import { cssRaw, stylesheet } from 'typestyle'

import { Action, createReducer, loadAppState } from './reducer'
import { Block } from './Block'
import { Overlay } from './component/Overlay'
import { factoryRegistry } from '../factories'
import { PubSub } from './lib/pubsub'
import { DatabaseInterface, Vec2 } from './interfaces'
import { useAnimationFrame } from './useAnimationFrame'
import { getUnifiedClientCoords, vecSub } from './lib/utils'

type Props = {
  db: DatabaseInterface
}

cssRaw(`
* {
  box-sizing: border-box;
  user-select: none;
}

html, body, #react-root {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

:root {
  font-size: 18px;
  font-family: 'Noto Sans', 'Noto Sans CJK TC', \
                -apple-system, BlinkMacSystemFont, \
               'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', \
               'Helvetica Neue', sans-serif;
  line-height: 1.6;
}`)

const styles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    background: '#e5e5e5',
    '--bg-hover': 'rgba(0, 0, 0, 0.1)',
    '--shadow-light': `\
      rgba(15, 15, 15, 0.1) 0px 0px 3px, 
      rgba(15, 15, 15, 0.1) 0px 0px 9px`,
    '--border-radius-small': '.3rem',
    '--border-radius-large': '.5rem',
  },
})

export const App: React.FunctionComponent<Props> = props => {
  const { db } = props

  const messenger = useMemo(() => new PubSub(), [])
  const appStateReducer = useCallback(createReducer(db), [])
  const initialState = useMemo(() => loadAppState(db), [])
  const [state, dispatchAction] = useReducer(appStateReducer, initialState)

  const toggleDebugging = () => {
    dispatchAction({ type: 'debugging::toggle' })
  }

  useEffect(() => {
    messenger.subscribe('user::toggleDebugging', toggleDebugging)
    return () => {
      messenger.unsubscribe('user::toggleDebugging', toggleDebugging)
    }
  }, [])

  const overlayRef = useRef<HTMLDivElement>(null)

  function createOverlay(children: React.ReactNode): React.ReactPortal {
    return ReactDOM.createPortal(children, overlayRef.current)
  }

  const actionQueueRef = useRef<Action[]>([])
  useAnimationFrame(() => {
    actionQueueRef.current.forEach(action => dispatchAction(action))
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
  }, [cameraElRef.current])

  return (
    <div className={styles.App}>
      <Overlay ref={overlayRef} />
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
            transform: `translate(${
              -state.camera.focus.x * state.camera.scale
            }px, ${-state.camera.focus.y * state.camera.scale}px) scale(${
              state.camera.scale
            })`,
          }}>
          {state.viewingConceptDetails
            .filter(
              c => !factoryRegistry.getFactory(c.concept.summary.type)?.isTool
            )
            .map(conceptDetail => {
              const key = 'ConceptRef-' + conceptDetail.link.id
              return (
                <Block
                  key={key}
                  block={state.blocks.find(b => b.id === conceptDetail.link.id)}
                  conceptDetail={conceptDetail}
                  createOverlay={createOverlay}
                  db={db}
                  dispatchAction={dispatchAction}
                  messageBus={messenger}
                  scheduleActionForAnimationFrame={action =>
                    actionQueueRef.current.push(action)
                  }
                  state={state}
                />
              )
            })}
        </div>
      </div>
      {state.viewingConceptDetails
        .filter(c => factoryRegistry.getFactory(c.concept.summary.type)?.isTool)
        .map(conceptDetail => {
          const key = 'ConceptRef-' + conceptDetail.link.id
          return (
            <Block
              key={key}
              block={state.blocks.find(b => b.id === conceptDetail.link.id)}
              conceptDetail={conceptDetail}
              createOverlay={createOverlay}
              db={db}
              dispatchAction={dispatchAction}
              messageBus={messenger}
              scheduleActionForAnimationFrame={action =>
                actionQueueRef.current.push(action)
              }
              state={state}
            />
          )
        })}
    </div>
  )
}
