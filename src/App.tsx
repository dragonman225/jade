/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { appStateReducer } from './core/model'
import { Block } from './core/Block'
import { Canvas } from './core/Canvas'
import { BlockFactory } from './core/BlockFactory'
import { InputContainer } from './core/InputContainer'
import { RecentTool } from './core/RecentTool'
import { SearchTool } from './core/SearchTool'
import { HeaderTool } from './core/HeaderTool'
import { Content } from './content/Content'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import {
  State3, BlockCard, ContentProps, BaseContent, InitializedContent
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
    React.useState([state.currentBlockCardId])
  const [last, setLast] = React.useState(0)

  const handleExpand = (blockCardId: string) => {
    if (blockCardId !== expandHistory[last]) {
      setLast(last + 1)
      expandHistory[(last + 1) % historySize] = blockCardId
      setExpandHistory(expandHistory)
      console.log(expandHistory)
      dispatchAction({ type: 'block::expand', data: { id: blockCardId } })
      resetInteractionLockOwner()
    }
  }

  const replaceContentType = (blockCard: BlockCard, newType: string) => {
    dispatchAction({
      type: 'block::edit', data: {
        id: blockCard.id,
        type: newType,
        content: { initialized: false }
      }
    })
  }

  const [recentToolState, setRecentToolState] = React.useState({
    position: { x: window.innerWidth - 500 - 24, y: 24 },
    width: 500
  })

  const [headerToolState, setHeaderToolState] = React.useState({
    position: { x: 24, y: 24 },
    width: 500,
    height: 50
  })

  const currentConcept = state.blockCardMap[state.currentBlockCardId]

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
          background: rgba(0,0,0,.2);
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
            <BlockFactory onRequestCreate={position => {
              dispatchAction({ type: 'block::create', data: { position } })
            }} />
            <div className="Search">
              <SearchTool state={state} onExpand={handleExpand}
                messenger={messenger}
                onRequestLink={data => {
                  dispatchAction({ type: 'block::link', data })
                }} />
            </div>
            <Block
              messenger={messenger}
              readOnly={false}
              data={{
                blockId: currentConcept.id,
                refId: '',
                type: '',
                content: { initialized: false },
                position: headerToolState.position,
                width: headerToolState.width
              }}
              onContentChange={() => { return }}
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
              onRemove={() => { return }}
              onExpand={() => { return }}
              key="HeaderTool">
              {
                (_contentProps) => <HeaderTool
                  width={headerToolState.width}
                  height={headerToolState.height}
                  concept={currentConcept}
                  readOnlyMessenger={readOnlyMessenger}
                  onHomeClick={() => { handleExpand(state.homeBlockCardId) }}
                  onConceptEdit={(data) => {
                    dispatchAction({
                      type: 'block::edit',
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
                blockId: '',
                refId: '',
                type: '',
                content: { initialized: false },
                position: recentToolState.position,
                width: recentToolState.width
              }}
              onContentChange={() => { return }}
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
              onRemove={() => { return }}
              onExpand={() => { return }}
              key="RecentTool">
              {
                (_contentProps) => <RecentTool
                  width={recentToolState.width}
                  history={expandHistory}
                  historySize={historySize}
                  current={last}
                  state={state}
                  messageBus={messenger}
                  onExpand={handleExpand} />
              }
            </Block>
            {
              state.blockCardMap[state.currentBlockCardId].blocks
                .map(blockRef => {
                  const referencedBlockCard = state.blockCardMap[blockRef.to]
                  const key = 'blockref-' + blockRef.id
                  return (
                    <Block
                      messenger={messenger}
                      readOnly={isInteractionLocked(key)}
                      data={{
                        blockId: referencedBlockCard.id,
                        refId: blockRef.id,
                        type: referencedBlockCard.type,
                        content: referencedBlockCard.content,
                        position: blockRef.position,
                        width: blockRef.width
                      }}
                      onContentChange={(content) => {
                        dispatchAction({
                          type: 'block::edit',
                          data: { ...referencedBlockCard, content }
                        })
                      }}
                      onResize={(width) => {
                        dispatchAction({
                          type: 'block::resize',
                          data: { id: blockRef.id, width }
                        })
                      }}
                      onMove={(position) => {
                        dispatchAction({
                          type: 'block::move',
                          data: { id: blockRef.id, position }
                        })
                      }}
                      onRemove={() => {
                        dispatchAction({
                          type: 'block::remove',
                          data: { id: blockRef.id }
                        })
                      }}
                      onExpand={() => { handleExpand(referencedBlockCard.id) }}
                      onInteractionStart={() => { lockInteraction(key) }}
                      onInteractionEnd={() => { unlockInteraction(key) }}
                      key={key}>
                      {
                        (contentProps) => <Content
                          contentType={referencedBlockCard.type}
                          contentProps={{
                            ...contentProps,
                            viewMode: 'block',
                            messageBus: readOnlyMessenger,
                            onReplace: type => {
                              replaceContentType(referencedBlockCard, type)
                            }
                          }} />
                      }
                    </Block>
                  )
                })
            }
            <Canvas
              messenger={messenger}
              readOnly={isInteractionLocked('canvas' + state.currentBlockCardId)}
              value={state.blockCardMap[state.currentBlockCardId].drawing}
              onChange={data => dispatchAction({ type: 'canvas::change', data })}
              onInteractionStart={() => { lockInteraction('canvas' + state.currentBlockCardId) }}
              onInteractionEnd={() => { unlockInteraction('canvas' + state.currentBlockCardId) }}
              /** Use key to remount Canvas when currentBlockCard changes. */
              key={'canvas-' + state.currentBlockCardId} />
          </InputContainer>
        </div>
      </div>
    </>
  )
}
