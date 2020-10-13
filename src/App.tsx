/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Block } from './components/Block'
import { Baby } from './components/Baby'
import { Text } from './components/Text'
import { Image } from './components/Image'
import { InputContainer } from './components/InputContainer'
import { Status } from './components/Status'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import {
  UnifiedEventInfo, MessengerStatus, State3, Vec2, Stroke,
  BlockCard, BlockModel, BlockCardRef, BlockContentProps
} from './interfaces'
import { Canvas } from './components/Canvas'
import { BlockFactory } from './components/BlockFactory'
import { Node } from 'slate'
import { adaptToBlockCard, adaptToBlockModel } from './lib/utils'

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
        console.log('update sync timeout')
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

  useEffect(() => {
    messenger.subscribe('user::createBlock', (msg: UnifiedEventInfo) => {
      dispatchAction({
        type: 'block::create',
        data: {
          position: {
            x: msg.offsetX,
            y: msg.offsetY
          }
        }
      })
    })
  }, [])

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

  const handleExpand = (blockCardId: string) => {
    dispatchAction({ type: 'block::expand', data: { id: blockCardId } })
    resetInteractionLockOwner()
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
        line-height: 1.6;
      }
    `}</style>
      <div className="bg-black-20 h-100 pa5">
        <InputContainer messenger={messenger}>
          <BlockFactory messenger={messenger} />
          {
            function () {
              const currentBlockCard = state.blockCardMap[state.currentBlockCard]
              const fakeBlockRef: BlockCardRef = {
                id: currentBlockCard.id,
                position: { x: 0, y: 0 },
                width: 300
              }
              const key = 'card' + currentBlockCard.id
              return (
                <Block
                  messenger={messenger}
                  readOnly={isInteractionLocked(key)}
                  value={adaptToBlockModel(currentBlockCard, fakeBlockRef) as BlockModel<Node[]>}
                  onChange={data => {
                    dispatchAction({
                      type: 'block::change', data: {
                        ...currentBlockCard,
                        content: data.content
                      }
                    })
                  }}
                  onRemove={() => { return }}
                  onExpand={() => { return }}
                  onInteractionStart={() => { lockInteraction(key) }}
                  onInteractionEnd={() => { unlockInteraction(key) }}
                  key={key}>
                  {
                    function () {
                      switch (currentBlockCard.type) {
                        case 'text':
                          return (props: BlockContentProps) => <Text viewMode="card" {...props} />
                        case 'image':
                          return (props: BlockContentProps) => <Image {...props} />
                        case 'status':
                          return () =>
                            <Status
                              messenger={messenger}
                              text={status.text} highlight={status.highlight} />
                        default:
                          return (props: BlockContentProps) => <Baby {...props} onReplace={
                            (newType) => {
                              dispatchAction({
                                type: 'block::change', data: {
                                  ...currentBlockCard,
                                  type: newType,
                                  content: null
                                }
                              })
                            }
                          } />
                      }
                    }()
                  }
                </Block>
              )
            }()
          }
          {
            state.blockCardMap[state.currentBlockCard].blocks.map(blockRef => {
              const currentBlockCard = state.blockCardMap[state.currentBlockCard]
              const referencedBlockCard = state.blockCardMap[blockRef.id]
              const key = 'block' + referencedBlockCard.id
              return (
                <Block
                  messenger={messenger}
                  readOnly={isInteractionLocked(key)}
                  value={adaptToBlockModel(referencedBlockCard, blockRef) as BlockModel<Node[]>}
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
                          return (props: BlockContentProps) => <Text viewMode="block" {...props} />
                        }
                        case 'image': {
                          return (props: BlockContentProps) => <Image {...props} />
                        }
                        case 'status': {
                          return () =>
                            <Status
                              messenger={messenger}
                              text={status.text} highlight={status.highlight} />
                        }
                        default: {
                          return (props: BlockContentProps) =>
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
            key={'canvas' + state.currentBlockCard} />
        </InputContainer>
      </div>
    </>
  )
}
