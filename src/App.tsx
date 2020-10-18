/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { appStateReducer } from './core/model'
import { Block } from './core/Block'
import { Canvas } from './core/Canvas'
import { IconHome } from './core/IconHome'
import { BlockFactory } from './core/BlockFactory'
import { InputContainer } from './core/InputContainer'
import { Recent } from './core/Recent'
import { Content } from './content/Content'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import { adaptToBlockCard, adaptToBlockModel } from './lib/utils'
import {
  State3, BlockCard, BlockModel, ContentProps
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

  const handleChange = (
    currentBlockCard: BlockCard,
    referencedBlockCard: BlockCard,
    data: BlockModel<unknown>
  ) => {
    const adapted = adaptToBlockCard(currentBlockCard, referencedBlockCard, data)
    dispatchAction({ type: 'block::change', data: adapted.newCurrentBlockCard })
    dispatchAction({ type: 'block::change', data: adapted.newReferencedBlockCard })
  }

  const historySize = 15
  const [expandHistory, setExpandHistory] = React.useState([state.currentBlockCard])
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

  const handleContentReplace = (blockCard: BlockCard, newType: string) => {
    dispatchAction({
      type: 'block::change', data: {
        ...blockCard,
        type: newType,
        content: null
      }
    })
  }

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
          height: 100%;
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
      <div className="App bg-black-20 h-100">
        <div className="Navbar">
          <div className="HomeBtnContainer">
            <button className="HomeBtn" onClick={() => {
              handleExpand(state.homeBlockCard)
            }}><IconHome /></button>
          </div>
          <div className="SummaryContainer">
            {
              function () {
                const currentBlockCard = state.blockCardMap[state.currentBlockCard]
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
                  onReplace: type => { handleContentReplace(currentBlockCard, type) },
                  onInteractionStart: () => { lockInteraction(key) },
                  onInteractionEnd: () => { unlockInteraction(key) },
                  key: key
                }
                return <Content contentType={currentBlockCard.type} contentProps={contentProps} />
              }()
            }
          </div>
          <div className="RecentContainer">
            <Recent
              history={expandHistory}
              historySize={historySize}
              current={last}
              state={state}
              messageBus={messenger}
              onExpand={handleExpand} />
          </div>
        </div>
        <div className="Playground">
          <InputContainer messenger={messenger}>
            <BlockFactory onRequestCreate={position => {
              dispatchAction({
                type: 'block::create',
                data: { position }
              })
            }} />
            {
              state.blockCardMap[state.currentBlockCard].blocks.map(blockRef => {
                const currentBlockCard = state.blockCardMap[state.currentBlockCard]
                const referencedBlockCard = state.blockCardMap[blockRef.id]
                const key = 'block-' + referencedBlockCard.id
                return (
                  <Block
                    messenger={messenger}
                    readOnly={isInteractionLocked(key)}
                    value={adaptToBlockModel(referencedBlockCard, blockRef)}
                    onContentChange={data => {
                      handleChange(currentBlockCard, referencedBlockCard, data)
                    }}
                    onRemove={() => {
                      dispatchAction({ type: 'block::remove', data: { id: referencedBlockCard.id } })
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
                            handleContentReplace(referencedBlockCard, type)
                          }
                        }} />
                    }
                  </Block>
                )
              })
            }
            <Canvas
              messenger={messenger}
              readOnly={isInteractionLocked('canvas' + state.currentBlockCard)}
              value={state.blockCardMap[state.currentBlockCard].drawing}
              onChange={data => dispatchAction({ type: 'canvas::change', data })}
              onInteractionStart={() => { lockInteraction('canvas' + state.currentBlockCard) }}
              onInteractionEnd={() => { unlockInteraction('canvas' + state.currentBlockCard) }}
              /** Use key to remount Canvas when currentBlockCard changes. */
              key={'canvas-' + state.currentBlockCard} />
          </InputContainer>
        </div>
      </div>
    </>
  )
}
