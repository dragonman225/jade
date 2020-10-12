/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react'
import { useEffect, useReducer, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Baby } from './components/Baby'
import { Block } from './components/Block'
import { Image } from './components/Image'
import { Text } from './components/Text'
import { InputContainer } from './components/InputContainer'
import { Status } from './components/Status'
import { PubSub } from './lib/pubsub'
import { loadState, saveState } from './lib/storage'
import {
  UnifiedEventInfo, MessengerStatus, BlockModel, State, Vec2, Stroke
} from './interfaces'
import { Canvas } from './components/Canvas'
import { BlockFactory } from './components/BlockFactory'
import { Node } from 'slate'

const initialState = require('./InitialState.json') as State

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
  data: BlockModel<any>
}

interface BlockRemoveAction {
  type: 'block::remove'
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
  BlockResizeAction | BlockChangeAction | BlockRemoveAction |
  CanvasChangeAction | DebuggingToggleAction

function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'block::create': {
      const block: BlockModel<any> = {
        id: uuidv4(),
        type: 'baby',
        content: null,
        position: action.data.position,
        width: 300
      }
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [block.id]: block
        }
      }
    }
    case 'block::move': {
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [action.data.id]: {
            ...state.blocks[action.data.id],
            position: action.data.position
          }
        }
      }
    }
    case 'block::resize': {
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [action.data.id]: {
            ...state.blocks[action.data.id],
            width: action.data.width
          }
        }
      }
    }
    case 'block::change': {
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [action.data.id]: action.data
        }
      }
    }
    case 'block::remove': {
      return {
        ...state,
        blocks: (function () {
          const blocks = {
            ...state.blocks
          }
          delete blocks[action.data.id]
          return blocks
        })()
      }
    }
    case 'canvas::change': {
      return {
        ...state,
        canvas: action.data
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
            Object.values(state.blocks).map(block => {
              switch (block.type) {
                case 'text': {
                  return (
                    <Block<Node[]>
                      messenger={messenger}
                      readOnly={isInteractionLocked(block.id)}
                      value={block}
                      onChange={data => { dispatchAction({ type: 'block::change', data }) }}
                      onRemove={() => { dispatchAction({ type: 'block::remove', data: { id: block.id } }) }}
                      onInteractionStart={() => { lockInteraction(block.id) }}
                      onInteractionEnd={() => { unlockInteraction(block.id) }}
                      key={block.id}>
                      {(props) => <Text {...props} />}
                    </Block>
                  )
                }
                case 'image': {
                  return (
                    <Block<string>
                      messenger={messenger}
                      readOnly={isInteractionLocked(block.id)}
                      value={block}
                      onChange={data => { dispatchAction({ type: 'block::change', data }) }}
                      onRemove={() => { dispatchAction({ type: 'block::remove', data: { id: block.id } }) }}
                      onInteractionStart={() => { lockInteraction(block.id) }}
                      onInteractionEnd={() => { unlockInteraction(block.id) }}
                      key={block.id}>
                      {(props) => <Image {...props} />}
                    </Block>
                  )
                }
                case 'status': {
                  return (
                    <Block<string>
                      messenger={messenger}
                      readOnly={isInteractionLocked(block.id)}
                      value={block}
                      onChange={data => { dispatchAction({ type: 'block::change', data }) }}
                      onRemove={() => { dispatchAction({ type: 'block::remove', data: { id: block.id } }) }}
                      onInteractionStart={() => { lockInteraction(block.id) }}
                      onInteractionEnd={() => { unlockInteraction(block.id) }}
                      key={block.id}>
                      {
                        () =>
                          <Status
                            messenger={messenger}
                            text={status.text} highlight={status.highlight} />
                      }
                    </Block>
                  )
                }
                default: {
                  return (
                    <Block<null>
                      messenger={messenger}
                      readOnly={isInteractionLocked(block.id)}
                      value={block}
                      onChange={data => { dispatchAction({ type: 'block::change', data }) }}
                      onRemove={() => { dispatchAction({ type: 'block::remove', data: { id: block.id } }) }}
                      onInteractionStart={() => { lockInteraction(block.id) }}
                      onInteractionEnd={() => { unlockInteraction(block.id) }}
                      key={block.id}>
                      {(props) => <Baby {...props} onReplace={
                        (newType) => {
                          dispatchAction({
                            type: 'block::change', data: {
                              ...block,
                              type: newType,
                              content: null
                            }
                          })
                        }
                      } />}
                    </Block>
                  )
                }
              }
            })
          }
          <Canvas
            messenger={messenger}
            readOnly={isInteractionLocked('canvas')}
            value={state.canvas}
            onChange={data => dispatchAction({ type: 'canvas::change', data })}
            onInteractionStart={() => { lockInteraction('canvas') }}
            onInteractionEnd={() => { unlockInteraction('canvas') }} />
        </InputContainer>
      </div>
    </>
  )
}
