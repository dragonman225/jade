/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { appStateReducer, getDetailsOfConcept } from './core/model'
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
  State3, Concept,
  OriginBottomLeft, OriginTopRight, OriginTopLeft
} from './interfaces'

const initialState = require('./InitialState.json') as State3

let lastSyncTime = 0
let timer: NodeJS.Timeout | undefined = undefined

export const App: React.FunctionComponent = () => {
  const messenger = useMemo(() => new PubSub(), [])
  const readOnlyMessenger = {
    subscribe: messenger.subscribe,
    unsubscribe: messenger.unsubscribe
  }
  const [state, dispatchAction] =
    useReducer(appStateReducer, loadState() || initialState)

  /** Interaction lock. */
  const [interactionLockOwner, setInteractionLockOwner] =
    React.useState<string>('')
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
  const [expandHistory, setExpandHistory] =
    React.useState([state.viewingConceptId])
  const [last, setLast] = React.useState(0)

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

  const [headerToolState, setHeaderToolState] = React.useState({
    origin: { type: 'TL', top: 0, left: 0 } as OriginTopLeft,
    position: { x: 24, y: 24 },
    width: 500
  })

  const [recentToolState, setRecentToolState] = React.useState({
    origin: { type: 'TR', top: 0, right: 0 } as OriginTopRight,
    position: { x: -24, y: 24 },
    width: 500
  })

  const [searchToolState, setSearchToolState] = React.useState({
    origin: { type: 'BL', bottom: 0, left: 0 } as OriginBottomLeft,
    position: { x: 24, y: -24 },
    width: 300
  })

  const currentConcept = state.conceptMap[state.viewingConceptId]
  const portalRef = React.useRef<HTMLDivElement>(null)

  return (
    <>
      <style jsx global>{`
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
        }
      `}</style>
      <style jsx>{`
        .App {
          overflow: hidden;
          height: 100%;
          background: #e5e5e5;
        }

        .Playground {
          position: relative;
          height: 100%;
        }

        .Search {
          position: absolute;
          left: 1.5rem;
          bottom: 1.5rem;
          z-index: 99;
        }

        .Recent {
          position: absolute;
          right: 1.5rem;
          top: 1.5rem;
          z-index: 99;
        }
      `}</style>
      <div className="App">
        <div className="Playground">
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
                  state={state} onExpand={handleExpand}
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
                        type: currentConcept.type,
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
                  state={state}
                  messageBus={messenger}
                  onExpand={handleExpand} />
              }
            </Block>
            {
              getDetailsOfConcept(state.viewingConceptId, state)
                .map(result => {
                  const subConcept = result.concept
                  const key = 'ConceptRef-' + result.link.id
                  return (
                    <Block
                      messenger={messenger}
                      readOnly={isInteractionLocked(key)}
                      data={{
                        blockId: subConcept.id,
                        position: result.link.data.position,
                        width: result.link.data.width
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
                          contentType={subConcept.type}
                          contentProps={{
                            ...contentProps,
                            viewMode: 'Block',
                            content: subConcept.data,
                            messageBus: readOnlyMessenger,
                            onChange: content => {
                              dispatchAction({
                                type: 'concept::datachange',
                                data: { ...subConcept, content }
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
              value={state.conceptMap[state.viewingConceptId].drawing}
              onChange={data => dispatchAction({ type: 'concept::drawingchange', data })}
              onInteractionStart={() => { lockInteraction('canvas' + state.viewingConceptId) }}
              onInteractionEnd={() => { unlockInteraction('canvas' + state.viewingConceptId) }}
              /** Use key to remount Canvas when currentBlockCard changes. */
              key={'canvas-' + state.viewingConceptId} />
          </InputContainer>
        </div>
      </div>
    </>
  )
}
