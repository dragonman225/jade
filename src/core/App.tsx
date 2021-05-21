/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useState,
  useRef,
} from 'react'
import { cssRaw, stylesheet } from 'typestyle'
import { v4 as uuidv4 } from 'uuid'
import { Action, createReducer, synthesizeView } from './reducer'
import { Block } from './Block'
import { Base } from './Base'
import { InputContainer } from './InputContainer'
import { CanvasTool } from './CanvasTool'
import { Box } from './component/Box'
import { Overlay } from './component/Overlay'
import { factoryRegistry } from '../factories'
import { PubSub } from './lib/pubsub'
import {
  OriginTopRight,
  DatabaseInterface,
  State4,
  ConceptId,
  Concept,
  ConceptDetail,
} from './interfaces'
import { useAnimationFrame } from './useAnimationFrame'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const initialConcepts = require('../initial-concepts.json') as Concept[]

function loadAppState(db: DatabaseInterface): State4 {
  console.log('Loading app state.')
  if (!db.isValid()) {
    const toolConcepts: Concept[] = factoryRegistry
      .getToolFactories()
      .map(f => ({
        id: uuidv4(),
        summary: { type: f.id, data: { initialized: false } },
        details: [],
        drawing: [],
      }))
    const toolMaskConcept: Concept = {
      id: '__tool_mask__',
      summary: { type: 'toolmask', data: { initialized: false } },
      details: toolConcepts.map(c => ({
        id: uuidv4(),
        type: 'contains',
        to: c.id,
        position: (() => {
          switch (c.summary.type) {
            case 'headertool':
              return { x: 50, y: 50 }
            default:
              return { x: 50, y: 200 }
          }
        })(),
        width: (() => {
          switch (c.summary.type) {
            case 'headertool':
              return 500
            default:
              return 300
          }
        })(),
      })),
      drawing: [],
    }
    db.init(
      {
        debugging: false,
        homeConceptId: 'home',
        viewingConceptId: 'home',
      },
      initialConcepts.concat(toolConcepts, toolMaskConcept)
    )
  }
  const settings = db.getSettings()
  const viewingConcept = db.getConcept(settings.viewingConceptId)
  const viewingConceptDetails = synthesizeView(viewingConcept, db)
  return {
    debugging: settings.debugging,
    homeConceptId: settings.homeConceptId,
    viewingConcept,
    viewingConceptDetails,
    expandHistory: new Array(99).concat(viewingConcept.id) as (
      | ConceptId
      | undefined
    )[],
    camera: {
      focus: { x: 0, y: 0 },
      scale: 1,
    },
  }
}

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
  Playground: {
    position: 'relative',
    height: '100%',
  },
})

export const App: React.FunctionComponent<Props> = props => {
  const { db } = props

  const messenger = useMemo(() => new PubSub(), [])
  const appStateReducer = useCallback(createReducer(db), [])
  const initialState = useMemo(() => loadAppState(db), [])
  const [state, dispatchAction] = useReducer(appStateReducer, initialState)

  /** Interaction lock. */
  const [interactionLockOwner, setInteractionLockOwner] = useState<string>('')
  const lockInteraction = (requester: string) => {
    console.log('app: lock:', requester, 'requests lock')
    if (interactionLockOwner === '') setInteractionLockOwner(requester)
  }
  const unlockInteraction = (requester: string) => {
    console.log('app: lock', requester, 'requests unlock')
    if (interactionLockOwner === requester || interactionLockOwner === '')
      setInteractionLockOwner('')
    /* HACK: if I don't check interactionLockOwner === '', 
       although interactionLockOwner is '', blocks are readOnly */
  }
  const isInteractionLocked = (requester: string) => {
    return !!interactionLockOwner && interactionLockOwner !== requester
  }
  const resetInteractionLockOwner = () => {
    setInteractionLockOwner('')
  }

  const toggleDebugging = () => {
    dispatchAction({ type: 'debugging::toggle' })
  }

  useEffect(() => {
    messenger.subscribe('user::toggleDebugging', toggleDebugging)
    return () => {
      messenger.unsubscribe('user::toggleDebugging', toggleDebugging)
    }
  }, [])

  const handleExpand = (toConceptId: string) => {
    if (toConceptId !== state.viewingConcept.id) {
      dispatchAction({ type: 'navigation::expand', data: { id: toConceptId } })
      resetInteractionLockOwner()
    }
  }

  const replaceContentType = (blockCard: Concept, newType: string) => {
    dispatchAction({
      type: 'concept::datachange',
      data: {
        id: blockCard.id,
        type: newType,
        content: { initialized: false },
      },
    })
  }

  const [canvasToolState, setCanvasToolState] = useState({
    origin: { type: 'TR', top: 0, right: 0 } as OriginTopRight,
    position: { x: -20, y: 200 },
    width: 50,
  })

  const currentConcept = state.viewingConcept
  const overlayRef = useRef<HTMLDivElement>(null)

  function createOverlay(children: React.ReactNode): React.ReactPortal {
    return ReactDOM.createPortal(children, overlayRef.current)
  }

  const actionQueueRef = useRef<Action[]>([])
  useAnimationFrame(() => {
    actionQueueRef.current.forEach(action => dispatchAction(action))
    actionQueueRef.current = []
  })

  function toBlock(conceptDetail: ConceptDetail) {
    const subConcept = conceptDetail.concept
    const key = 'ConceptRef-' + conceptDetail.link.id
    return (
      <Block
        messenger={messenger}
        readOnly={isInteractionLocked(key)}
        data={{
          blockId: subConcept.id,
          position: conceptDetail.link.position,
          width: conceptDetail.link.width,
        }}
        origin={{ type: 'TL', top: 0, left: 0 }}
        zIndex={1}
        camera={state.camera}
        container={
          factoryRegistry.getFactory(subConcept.summary.type)?.isTool
            ? Box
            : undefined
        }
        onResize={width => {
          dispatchAction({
            type: 'ref::resize',
            data: { id: conceptDetail.link.id, width },
          })
        }}
        onMove={position => {
          dispatchAction({
            type: 'ref::move',
            data: { id: conceptDetail.link.id, position },
          })
        }}
        onRemove={() => {
          dispatchAction({
            type: 'ref::remove',
            data: { id: conceptDetail.link.id },
          })
        }}
        onExpand={() => {
          handleExpand(subConcept.id)
        }}
        onInteractionStart={() => {
          lockInteraction(key)
        }}
        onInteractionEnd={() => {
          unlockInteraction(key)
        }}
        key={key}>
        {contentProps =>
          factoryRegistry.createConceptDisplay(subConcept.summary.type, {
            ...contentProps,
            viewMode: 'Block',
            content: subConcept.summary.data,
            messageBus: messenger,
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
              replaceContentType(subConcept, type)
            },
            createOverlay,
          })
        }
      </Block>
    )
  }

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
    console.log(cameraElRef)

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        console.log(e)
        e.preventDefault()
        dispatchAction({
          type: 'cam::scaledelta',
          data: {
            focus: { x: e.clientX, y: e.clientY },
            wheelDelta: e.deltaY,
          },
        })
      }
    }

    cameraElRef.current.addEventListener('wheel', handleWheel)

    return () => cameraElRef.current.removeEventListener('wheel', handleWheel)
  }, [cameraElRef.current])

  return (
    // <div
    //   ref={wheelDetectorRef}
    //   style={{
    //     width: 100,
    //     height: 100,
    //     background: 'red',
    //   }}
    // />
    <div className={styles.App}>
      <div className={styles.Playground}>
        <InputContainer messenger={messenger}>
          <Overlay ref={overlayRef} />
          <Base
            onRequestCreate={rawPos => {
              dispatchAction({
                type: 'concept::create',
                data: {
                  position: {
                    x: rawPos.x + state.camera.focus.x,
                    y: rawPos.y + state.camera.focus.y,
                  },
                },
              })
            }}
            onPan={delta =>
              actionQueueRef.current.push({
                type: 'cam::movedelta',
                data: delta,
              })
            }
          />
          <div
            ref={cameraElRef}
            style={{ position: 'absolute', width: '100%', height: '100%' }}>
            <div
              style={{
                position: 'relative',
                transformOrigin: 'left top',
                transform: `translate(${
                  -state.camera.focus.x * state.camera.scale
                }px, ${-state.camera.focus.y * state.camera.scale}px) scale(${
                  state.camera.scale
                })`,
              }}>
              {state.viewingConceptDetails
                .filter(
                  c =>
                    !factoryRegistry.getFactory(c.concept.summary.type)?.isTool
                )
                .map(toBlock)}
            </div>
          </div>
          {state.viewingConceptDetails
            .filter(
              c => factoryRegistry.getFactory(c.concept.summary.type)?.isTool
            )
            .map(toBlock)}
          <Block
            messenger={messenger}
            readOnly={false}
            data={{
              blockId: 'CanvasTool',
              position: canvasToolState.position,
              width: canvasToolState.width,
            }}
            origin={canvasToolState.origin}
            // HACK: Use z-index to hide canvas ctrl block.
            zIndex={
              interactionLockOwner === 'canvas' + state.viewingConcept.id
                ? 2
                : -999
            }
            camera={state.camera}
            container={Box}
            onResize={width => {
              setCanvasToolState({
                ...canvasToolState,
                width,
              })
            }}
            onMove={position => {
              setCanvasToolState({
                ...canvasToolState,
                position,
              })
            }}
            key="CanvasTool">
            {contentProps => (
              <CanvasTool
                messenger={messenger}
                readOnly={isInteractionLocked(
                  'canvas' + state.viewingConcept.id
                )}
                value={currentConcept.drawing}
                onChange={data =>
                  dispatchAction({ type: 'concept::drawingchange', data })
                }
                onInteractionStart={() => {
                  lockInteraction('canvas' + state.viewingConcept.id)
                }}
                onInteractionEnd={() => {
                  unlockInteraction('canvas' + state.viewingConcept.id)
                }}
                scheduleCanvasInsertion={cb => {
                  cb(overlayRef.current)
                }}
                mouseIsInsideBlock={contentProps.mouseIsInside}
                /** Use key to remount Canvas when currentBlockCard changes. */
                key={'canvas-' + state.viewingConcept.id}
              />
            )}
          </Block>
        </InputContainer>
      </div>
    </div>
  )
}
