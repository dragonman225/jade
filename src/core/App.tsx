/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  useEffect, useReducer, useMemo, useCallback, useState, useRef
} from 'react'
import { cssRaw, stylesheet } from 'typestyle'
import { createReducer } from './reducer'
import { Block } from './Block'
import { BlockFactory } from './BlockFactory'
import { InputContainer } from './InputContainer'
import { CanvasTool } from './CanvasTool'
import { RecentTool } from './RecentTool'
import { SearchTool } from './SearchTool'
import { HeaderTool } from './HeaderTool'
import { Box } from './component/Box'
import { Overlay } from './component/Overlay'
import { Content } from '../content-plugins'
import { PubSub } from './lib/pubsub'
import {
  OriginBottomLeft, OriginTopRight, OriginTopLeft, DatabaseInterface, State4
} from './interfaces'
import { Concept } from './interfaces/concept'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const initialConcepts = require('../initial-concepts.json')

function loadAppState(db: DatabaseInterface): State4 {
  console.log('Loading app state.')
  if (!db.isValid()) {
    db.init({
      debugging: false,
      homeConceptId: 'home',
      viewingConceptId: 'home'
    }, initialConcepts)
  }
  const settings = db.getSettings()
  const viewingConcept = db.getConcept(settings.viewingConceptId)
  const viewingConceptDetails = Concept.details(viewingConcept, db)
  return {
    debugging: settings.debugging,
    homeConceptId: settings.homeConceptId,
    viewingConcept,
    viewingConceptDetails
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
  font-family: 'Noto Sans CJK TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
}`)

const styles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    background: '#e5e5e5',
    '--bg-hover': 'rgba(0, 0, 0, 0.1)'
  },
  Playground: {
    position: 'relative',
    height: '100%'
  }
})

export const App: React.FunctionComponent<Props> = (props) => {
  const messenger = useMemo(() => new PubSub(), [])
  const readOnlyMessenger = {
    subscribe: messenger.subscribe,
    unsubscribe: messenger.unsubscribe
  }
  const appStateReducer = useCallback(createReducer(props.db), [])
  const initialState = useMemo(() => loadAppState(props.db), [])
  const [state, dispatchAction] = useReducer(appStateReducer, initialState)

  /** Interaction lock. */
  const [interactionLockOwner, setInteractionLockOwner] = useState<string>('')
  const lockInteraction = (requester: string) => {
    console.log('app: lock:', requester, 'requests lock')
    if (interactionLockOwner === '') setInteractionLockOwner(requester)
  }
  const unlockInteraction = (requester: string) => {
    console.log('app: lock', requester, 'requests unlock')
    if (interactionLockOwner === requester ||
      interactionLockOwner === '') setInteractionLockOwner('')
    // HACK: if I don't check interactionLockOwner === '', although interactionLockOwner is '', blocks are readOnly
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

  const historySize = 15
  const [expandHistory, setExpandHistory] = useState([state.viewingConcept.id])
  const [last, setLast] = useState(0)

  const handleExpand = (blockCardId: string) => {
    if (blockCardId !== expandHistory[last]) {
      setLast(last + 1)
      expandHistory[(last + 1) % historySize] = blockCardId
      setExpandHistory(expandHistory)
      console.log('app: history:', expandHistory)
      dispatchAction({ type: 'navigation::expand', data: { id: blockCardId } })
      resetInteractionLockOwner()
    }
  }

  const replaceContentType = (blockCard: Concept, newType: string) => {
    dispatchAction({
      type: 'concept::datachange', data: {
        id: blockCard.id,
        type: newType,
        content: { initialized: false }
      }
    })
  }

  const [headerToolState, setHeaderToolState] = useState({
    origin: { type: 'TL', top: 0, left: 0 } as OriginTopLeft,
    position: { x: 20, y: 20 },
    width: 500
  })

  const [recentToolState, setRecentToolState] = useState({
    origin: { type: 'TR', top: 0, right: 0 } as OriginTopRight,
    position: { x: -20, y: 20 },
    width: 500
  })

  const [searchToolState, setSearchToolState] = useState({
    origin: { type: 'BL', bottom: 0, left: 0 } as OriginBottomLeft,
    position: { x: 20, y: -20 },
    width: 300
  })

  const [canvasToolState, setCanvasToolState] = useState({
    origin: { type: 'TR', top: 0, right: 0 } as OriginTopRight,
    position: { x: -20, y: 200 },
    width: 50
  })

  const currentConcept = state.viewingConcept
  const overlayRef = useRef<HTMLDivElement>(null)

  function createOverlay(children: React.ReactNode): React.ReactPortal {
    return ReactDOM.createPortal(children, overlayRef.current)
  }

  return (
    <div className={styles.App}>
      <div className={styles.Playground}>
        <InputContainer messenger={messenger}>
          <Overlay ref={overlayRef} />
          <BlockFactory onRequestCreate={position => {
            dispatchAction({ type: 'concept::create', data: { position } })
          }} />
          <Block
            messenger={messenger}
            readOnly={false}
            data={{
              blockId: 'SearchTool',
              position: searchToolState.position,
              width: searchToolState.width
            }}
            origin={searchToolState.origin}
            zIndex={2}
            container={Box}
            onResize={(width) => {
              setSearchToolState({
                ...searchToolState,
                width
              })
            }}
            onMove={(position) => {
              setSearchToolState({
                ...searchToolState,
                position
              })
            }}
            key="SearchTool">
            {
              (_contentProps) => <SearchTool createOverlay={createOverlay}
                db={props.db} onExpand={handleExpand}
                messenger={messenger}
                onRequestLink={data => {
                  dispatchAction({ type: 'link::create', data })
                }} />
            }
          </Block>
          <Block
            messenger={messenger}
            readOnly={false}
            data={{
              blockId: 'HeaderTool',
              position: headerToolState.position,
              width: headerToolState.width
            }}
            origin={headerToolState.origin}
            zIndex={2}
            container={Box}
            onResize={(width) => {
              setHeaderToolState({
                ...headerToolState,
                width
              })
            }}
            onMove={(position) => {
              setHeaderToolState({
                ...headerToolState,
                position
              })
            }}
            key="HeaderTool">
            {
              (_contentProps) => <HeaderTool
                concept={currentConcept}
                readOnlyMessenger={readOnlyMessenger}
                onHomeClick={() => { handleExpand(state.homeConceptId) }}
                onConceptEdit={(data) => {
                  dispatchAction({
                    type: 'concept::datachange',
                    data: {
                      id: currentConcept.id,
                      type: currentConcept.summary.type,
                      content: data
                    }
                  })
                }}
                onConceptReplace={(typeId) => {
                  replaceContentType(currentConcept, typeId)
                }} />
            }
          </Block>
          <Block
            messenger={messenger}
            readOnly={false}
            data={{
              blockId: 'RecentTool',
              position: recentToolState.position,
              width: recentToolState.width
            }}
            origin={recentToolState.origin}
            zIndex={2}
            container={Box}
            onResize={(width) => {
              setRecentToolState({
                ...recentToolState,
                width
              })
            }}
            onMove={(position) => {
              setRecentToolState({
                ...recentToolState,
                position
              })
            }}
            key="RecentTool">
            {
              (contentProps) => <RecentTool
                width={contentProps.width}
                history={expandHistory}
                historySize={historySize}
                current={last}
                db={props.db}
                messageBus={messenger}
                onExpand={handleExpand} />
            }
          </Block>
          {
            state.viewingConceptDetails.map(result => {
              const subConcept = result.concept
              const key = 'ConceptRef-' + result.link.id
              return (
                <Block
                  messenger={messenger}
                  readOnly={isInteractionLocked(key)}
                  data={{
                    blockId: subConcept.id,
                    position: result.link.position,
                    width: result.link.width
                  }}
                  origin={{ type: 'TL', top: 0, left: 0 }}
                  zIndex={1}
                  onResize={(width) => {
                    dispatchAction({
                      type: 'containslink::resize',
                      data: { id: result.link.id, width }
                    })
                  }}
                  onMove={(position) => {
                    dispatchAction({
                      type: 'containslink::move',
                      data: { id: result.link.id, position }
                    })
                  }}
                  onRemove={() => {
                    dispatchAction({
                      type: 'link::remove',
                      data: { id: result.link.id }
                    })
                  }}
                  onExpand={() => { handleExpand(subConcept.id) }}
                  onInteractionStart={() => { lockInteraction(key) }}
                  onInteractionEnd={() => { unlockInteraction(key) }}
                  key={key}>
                  {
                    (contentProps) => <Content
                      contentType={subConcept.summary.type}
                      contentProps={{
                        ...contentProps,
                        viewMode: 'Block',
                        content: subConcept.summary.data,
                        messageBus: readOnlyMessenger,
                        onChange: content => {
                          dispatchAction({
                            type: 'concept::datachange',
                            data: {
                              id: subConcept.id,
                              type: subConcept.summary.type,
                              content
                            }
                          })
                        },
                        onReplace: type => {
                          replaceContentType(subConcept, type)
                        }
                      }} />
                  }
                </Block>
              )
            })
          }
          <Block
            messenger={messenger}
            readOnly={false}
            data={{
              blockId: 'CanvasTool',
              position: canvasToolState.position,
              width: canvasToolState.width
            }}
            origin={canvasToolState.origin}
            // HACK: Use z-index to hide canvas ctrl block.
            zIndex={interactionLockOwner === 'canvas' + state.viewingConcept.id ? 2 : -999}
            container={Box}
            onResize={(width) => {
              setCanvasToolState({
                ...canvasToolState,
                width
              })
            }}
            onMove={(position) => {
              setCanvasToolState({
                ...canvasToolState,
                position
              })
            }}
            key="CanvasTool">
            {
              (contentProps) => <CanvasTool
                messenger={messenger}
                readOnly={isInteractionLocked('canvas' + state.viewingConcept.id)}
                value={currentConcept.drawing}
                onChange={data => dispatchAction({ type: 'concept::drawingchange', data })}
                onInteractionStart={() => { lockInteraction('canvas' + state.viewingConcept.id) }}
                onInteractionEnd={() => { unlockInteraction('canvas' + state.viewingConcept.id) }}
                scheduleCanvasInsertion={(cb) => {
                  cb(overlayRef.current)
                }}
                mouseIsInsideBlock={contentProps.mouseIsInside}
                /** Use key to remount Canvas when currentBlockCard changes. */
                key={'canvas-' + state.viewingConcept.id} />
            }
          </Block>
        </InputContainer>
      </div>
    </div>
  )
}
