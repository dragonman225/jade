/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { appStateReducer } from './core/model'
import { Block } from './core/Block'
import { Canvas } from './core/Canvas'
import { IconHome } from './core/component/IconHome'
import { BlockFactory } from './core/BlockFactory'
import { InputContainer } from './core/InputContainer'
import { Recent } from './core/Recent'
import { Search } from './core/Search'
import { Content } from './content/Content'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import { adaptToBlockModel } from './lib/utils'
import {
  State3, BlockCard, ContentProps
} from './interfaces'

const initialState = require('./InitialState.json') as State3

let lastSyncTime = 0
let timer: NodeJS.Timeout = undefined

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
    if (interactionLockOwner === requester) setInteractionLockOwner('')
  }
  const isInteractionLocked = (requester: string) => {
    return interactionLockOwner && interactionLockOwner !== requester
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
      type: 'block::change', data: {
        ...blockCard,
        type: newType,
        content: null
      }
    })
  }

  const currentBlockCard = state.blockCardMap[state.currentBlockCardId]

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

        .Navbar {
          height: 50px;
          display: flex; 
          flex-wrap: nowrap;
        }

        .HomeBtnContainer {
          flex: 0 0 50px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .SummaryContainer {
          flex: 7 7 50px;
          max-width: 800px;
          overflow: auto;
        }

        .RecentContainer {
          flex: 3 3 50px;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .Playground {
          position: relative;
          height: calc(100% - 50px);
        }

        .HomeBtn {
          width: 30px;
          height: 30px;
          fill: #000;
          transition: transform 0.2s ease-in-out;
        }

        .HomeBtn:hover {
          transform: scale(1.2);
        }
        
        .HomeBtn:active {
          transform: scale(0.9);
        }

        button {
          border: none;
          background: unset;
        }

        button:focus {
          outline: none;
        }
      `}</style>
      <style jsx>{`
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
        <div className="Navbar">
          <div className="HomeBtnContainer">
            <button className="HomeBtn" onClick={() => {
              handleExpand(state.homeBlockCardId)
            }}><IconHome /></button>
          </div>
          <div className="SummaryContainer">
            {
              function () {
                const key = 'card-' + currentBlockCard.id
                const updateContent = (content: unknown) => {
                  dispatchAction({
                    type: 'block::change', data: {
                      ...currentBlockCard,
                      content
                    }
                  })
                }
                const contentProps: ContentProps<unknown> & { key: string } = {
                  viewMode: 'card',
                  readOnly: isInteractionLocked(key),
                  content: currentBlockCard.content,
                  messageBus: readOnlyMessenger,
                  onChange: updateContent,
                  onReplace: type => {
                    replaceContentType(currentBlockCard, type)
                  },
                  onInteractionStart: () => { lockInteraction(key) },
                  onInteractionEnd: () => { unlockInteraction(key) },
                  key: key
                }
                return <Content contentType={currentBlockCard.type}
                  contentProps={contentProps} />
              }()
            }
          </div>
        </div>
        <div className="Playground">
          <InputContainer messenger={messenger}>
            <BlockFactory onRequestCreate={position => {
              dispatchAction({ type: 'block::create', data: { position } })
            }} />
            <div className="Search">
              <Search state={state} onExpand={handleExpand}
                messenger={messenger}
                onRequestLink={data => {
                  dispatchAction({ type: 'block::link', data })
                }} />
            </div>
            <div className="Recent">
              <Recent
                history={expandHistory}
                historySize={historySize}
                current={last}
                state={state}
                messageBus={messenger}
                onExpand={handleExpand} />
            </div>
            {
              state.blockCardMap[state.currentBlockCardId].blocks
                .map(blockRef => {
                  const referencedBlockCard = state.blockCardMap[blockRef.to]
                  const key = 'blockref-' + blockRef.id
                  return (
                    <Block
                      messenger={messenger}
                      readOnly={isInteractionLocked(key)}
                      value={adaptToBlockModel(referencedBlockCard, blockRef)}
                      onContentChange={(content) => {
                        dispatchAction({
                          type: 'block::change',
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
