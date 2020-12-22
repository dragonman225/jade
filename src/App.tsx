/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import {
  useEffect, useReducer, useMemo, useCallback, useState, useRef
} from 'react'
import { cssRaw, stylesheet } from 'typestyle'
import { createReducer } from './core/model'
import { Block } from './core/Block'
import { Canvas } from './core/Canvas'
import { BlockFactory } from './core/BlockFactory'
import { InputContainer } from './core/InputContainer'
import { RecentTool } from './core/RecentTool'
import { SearchTool } from './core/SearchTool'
import { HeaderTool } from './core/HeaderTool'
import { Box } from './core/component/Box'
import { Portal } from './core/component/Portal'
import { Content } from './content/Content'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import {
  State3, OriginBottomLeft, OriginTopRight, OriginTopLeft, Database
} from './core/interfaces'
import { Concept } from './core/interfaces/concept'

const initialState = require('./InitialState.json') as State3

let lastSyncTime = 0
let timer: NodeJS.Timeout | undefined = undefined

type Props = {
  db: Database
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
  font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
}`)

const styles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    background: '#e5e5e5'
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
  const reducer = useCallback(createReducer(props.db), [])
  const [state, dispatchAction] = useReducer(reducer, loadState() || initialState)

  /** Interaction lock. */
  const [interactionLockOwner, setInteractionLockOwner] = useState<string>('')
  const lockInteraction = (requester: string) => {
    console.log(requester, 'requests lock')
    if (interactionLockOwner === '') setInteractionLockOwner(requester)
  }
  const unlockInteraction = (requester: string) => {
    console.log(requester, 'requests unlock')
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

  /** State Sync. */
  useEffect(() => {
    const now = Date.now()
    const minInterval = 500
    if (now - lastSyncTime > minInterval) {
      console.log('sync immediately')
      saveState(state)
      lastSyncTime = now
    } else {
      if (timer) {
        clearTimeout(timer)
      }
      const t = setTimeout(() => {
        console.log('sync after timeout')
        saveState(state)
        lastSyncTime = now
      }, minInterval)
      timer = t
    }
  }, [state])

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
  const [expandHistory, setExpandHistory] = useState([state.viewingConceptId])
  const [last, setLast] = useState(0)

  const handleExpand = (blockCardId: string) => {
    if (blockCardId !== expandHistory[last]) {
      setLast(last + 1)
      expandHistory[(last + 1) % historySize] = blockCardId
      setExpandHistory(expandHistory)
      console.log(expandHistory)
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

  const currentConcept = props.db.getConcept(state.viewingConceptId)
  const portalRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.App}>
      <div className={styles.Playground}>
        <InputContainer messenger={messenger}>
          <Portal ref={portalRef} />
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
              (_contentProps) => <SearchTool portal={portalRef}
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
            Concept.details(currentConcept, props.db)
              .map(result => {
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
          <Canvas
            messenger={messenger}
            readOnly={isInteractionLocked('canvas' + state.viewingConceptId)}
            value={currentConcept.drawing}
            onChange={data => dispatchAction({ type: 'concept::drawingchange', data })}
            onInteractionStart={() => { lockInteraction('canvas' + state.viewingConceptId) }}
            onInteractionEnd={() => { unlockInteraction('canvas' + state.viewingConceptId) }}
            /** Use key to remount Canvas when currentBlockCard changes. */
            key={'canvas-' + state.viewingConceptId} />
        </InputContainer>
      </div>
    </div>
  )
}
