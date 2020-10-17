/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Block } from './core/Block'
import { Canvas } from './core/Canvas'
import { IconHome } from './core/IconHome'
import { BlockFactory } from './core/BlockFactory'
import { InputContainer } from './core/InputContainer'
import { Baby } from './content/Baby'
import { Text } from './content/Text'
import { PMText } from './content/PMText'
import { Image } from './content/Image'
import { Status } from './content/Status'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import { adaptToBlockCard, adaptToBlockModel } from './lib/utils'
import {
  UnifiedEventInfo, MessengerStatus, State3, Vec2, Stroke,
  BlockCard, BlockModel, BlockContentProps
} from './interfaces'

const initialState = require('./InitialState.json') as State3

interface BlockCreateAction {
  type: 'block::create'
  data: {
    position: Vec2
  }
}

interface BlockMoveAction {
  type: 'block::move'
  data: {
    id: string
    position: Vec2
  }
}

interface BlockResizeAction {
  type: 'block::resize'
  data: {
    id: string
    width: number
  }
}

interface BlockChangeAction {
  type: 'block::change'
  data: BlockCard
}

interface BlockRemoveAction {
  type: 'block::remove'
  data: {
    id: string
  }
}

interface BlockExpandAction {
  type: 'block::expand'
  data: {
    id: string
  }
}

interface CanvasChangeAction {
  type: 'canvas::change'
  data: Stroke[]
}

interface DebuggingToggleAction {
  type: 'debugging::toggle'
}

type Action =
  BlockCreateAction | BlockMoveAction |
  BlockResizeAction | BlockChangeAction |
  BlockRemoveAction | BlockExpandAction |
  CanvasChangeAction | DebuggingToggleAction

function stateReducer(state: State3, action: Action): State3 {
  switch (action.type) {
    case 'block::create': {
      const block: BlockCard = {
        id: uuidv4(),
        type: 'baby',
        content: null,
        drawing: [],
        blocks: []
      }
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [state.currentBlockCard]: {
            ...state.blockCardMap[state.currentBlockCard],
            blocks: state.blockCardMap[state.currentBlockCard].blocks.concat([{
              id: block.id,
              position: action.data.position,
              width: 300
            }])
          },
          [block.id]: block
        }
      }
    }
    case 'block::move': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks.map(block => {
              if (block.id === action.data.id) {
                return {
                  ...block,
                  position: action.data.position
                }
              } else {
                return block
              }
            })
          }
        }
      }
    }
    case 'block::resize': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks.map(block => {
              if (block.id === action.data.id) {
                return {
                  ...block,
                  width: action.data.width
                }
              } else {
                return block
              }
            })
          }
        }
      }
    }
    case 'block::change': {
      const toChange = action.data.id
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: action.data
        }
      }
    }
    case 'block::remove': { // remove reference only
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks.filter(block => block.id !== action.data.id)
          }
        }
      }
    }
    case 'block::expand': {
      return {
        ...state,
        currentBlockCard: action.data.id
      }
    }
    case 'canvas::change': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            drawing: action.data
          }
        }
      }
    }
    case 'debugging::toggle': {
      return {
        ...state,
        debugging: state.debugging ? false : true
      }
    }
  }
}

let lastSyncTime = 0
let timer: NodeJS.Timeout = undefined

export const App: React.FunctionComponent = () => {
  const messenger = useMemo(() => new PubSub(), [])
  const [state, dispatchAction] =
    useReducer(stateReducer, loadState() || initialState)

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

  const [status, dispatchStatus] = useReducer(
    (
      state: { text: string; highlight: string },
      action:
      { type: 'messenger::subscribe'; msg: MessengerStatus } |
      { type: 'messenger::publish'; msg: { channel: string } }
    ) => {
      if (action.type === 'messenger::subscribe') {
        const channels = action.msg.channels
        const result = Object.values(channels).reduce((result, cv) => {
          return result += `${cv.name}: ${cv.subNum}\n`
        }, '')
        return { text: result, highlight: 'messenger::subscribe' }
      } else if (action.type === 'messenger::publish') {
        return { text: state.text, highlight: action.msg.channel }
      } else {
        return state
      }
    },
    { text: '', highlight: '' }
  )
  useEffect(() => {
    messenger.subscribe('messenger::subscribe', (msg: MessengerStatus) => {
      dispatchStatus({
        type: 'messenger::subscribe', msg
      })
    })
    messenger.subscribe('messenger::publish', (msg: { channel: string }) => {
      dispatchStatus({
        type: 'messenger::publish', msg
      })
    })
    messenger.subscribe('user::toggleDebugging', () => {
      dispatchAction({ type: 'debugging::toggle' })
    })
  }, [])

  const handleChange = (currentBlockCard: BlockCard, referencedBlockCard: BlockCard, data: BlockModel<unknown>) => {
    const adapted = adaptToBlockCard(currentBlockCard, referencedBlockCard, data)
    dispatchAction({ type: 'block::change', data: adapted.newCurrentBlockCard })
    dispatchAction({ type: 'block::change', data: adapted.newReferencedBlockCard })
  }

  const historySize = 15
  const [expandHistory, setExpandHistory] = React.useState([] as string[])
  const [last, setLast] = React.useState(-1)
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
          flex: 2 2 200px;
          max-width: 800px;
          overflow: auto;
        }

        .Recents {
          flex: 1 1 100px;
          display: flex;
          overflow-y: hidden;
          overflow-x: auto;
        }

        .RecentBtn {
          flex: 1 0 100px;
          min-width: 100px;
          height: 50px;
          transition: background 0.2s;
        }

        .RecentBtn:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .RecentBtn:active {
          background: rgba(0, 0, 0, 0.1);
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
        <InputContainer messenger={messenger}>
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
                  const contentProps: BlockContentProps<unknown> & { key: string } = {
                    viewMode: 'card',
                    readOnly: isInteractionLocked(key),
                    content: currentBlockCard.content,
                    onChange: updateContent,
                    onInteractionStart: () => { lockInteraction(key) },
                    onInteractionEnd: () => { unlockInteraction(key) },
                    key: key
                  }
                  switch (currentBlockCard.type) {
                    case 'text':
                      return <Text {...contentProps} />
                    case 'pmtext':
                      return <PMText {...contentProps} />
                    case 'image':
                      return <Image {...contentProps} />
                    default:
                      return <span>Cannot display {currentBlockCard.type} as Card title</span>
                  }
                }()
              }
            </div>
            <div className="Recents">
              {
                expandHistory
                  .reduce((historyToShow, blockCardId) => {
                    if (typeof historyToShow.find((id) => id === blockCardId) === 'undefined') {
                      if (blockCardId !== state.homeBlockCard && blockCardId !== state.currentBlockCard)
                        historyToShow.push(blockCardId)
                    }
                    return historyToShow
                  }, [] as string[])
                  .map(blockCardId => {
                    const blockCard = state.blockCardMap[blockCardId]
                    const contentProps: BlockContentProps<unknown> = {
                      viewMode: 'nav_item',
                      readOnly: true,
                      content: blockCard.content,
                      onChange: () => { return },
                      onInteractionStart: () => { return },
                      onInteractionEnd: () => { return },
                    }
                    const content = function () {
                      switch (blockCard.type) {
                        case 'text':
                          return <Text {...contentProps} />
                        case 'pmtext':
                          return <PMText {...contentProps} />
                        case 'image':
                          return <Image {...contentProps} />
                        default:
                          return <span>{blockCard.type}</span>
                      }
                    }()
                    return <button
                      className="RecentBtn"
                      onClick={() => { handleExpand(blockCardId) }}
                      key={blockCardId}>{content}</button>
                  })
              }
            </div>
          </div>
          <div className="Playground">
            <BlockFactory onRequestCreate={(info: UnifiedEventInfo) => {
              dispatchAction({
                type: 'block::create',
                data: {
                  position: {
                    x: info.offsetX,
                    y: info.offsetY
                  }
                }
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
                    onChange={data => {
                      handleChange(currentBlockCard, referencedBlockCard, data)
                    }}
                    onRemove={() => { dispatchAction({ type: 'block::remove', data: { id: referencedBlockCard.id } }) }}
                    onExpand={() => { handleExpand(referencedBlockCard.id) }}
                    onInteractionStart={() => { lockInteraction(key) }}
                    onInteractionEnd={() => { unlockInteraction(key) }}
                    key={key}>
                    {
                      function () {
                        switch (referencedBlockCard.type) {
                          case 'text': {
                            return (props: BlockContentProps<unknown>) => <Text viewMode="block" {...props} />
                          }
                          case 'pmtext': {
                            return (props: BlockContentProps<unknown>) => <PMText viewMode="block" {...props} />
                          }
                          case 'image': {
                            return (props: BlockContentProps<unknown>) => <Image {...props} />
                          }
                          case 'status': {
                            return () =>
                              <Status
                                messenger={messenger}
                                text={status.text} highlight={status.highlight} />
                          }
                          default: {
                            return (props: BlockContentProps<unknown>) =>
                              <Baby {...props} onReplace={
                                (newType) => {
                                  dispatchAction({
                                    type: 'block::change', data: {
                                      ...referencedBlockCard,
                                      type: newType,
                                      content: null
                                    }
                                  })
                                }
                              } />
                          }
                        }
                      }()
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
              /** Use key to remount when currentBlockCard changes. */
              key={'canvas-' + state.currentBlockCard} />
          </div>
        </InputContainer>
      </div>
    </>
  )
}
