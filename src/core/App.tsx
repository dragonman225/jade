/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useReducer, useMemo, useCallback, useRef } from 'react'
import { cssRaw, stylesheet } from 'typestyle'

import { Viewport } from './components/Viewport'
import { Overlay } from './components/Overlay'
import { Action, createReducer, loadAppState } from './reducer'
import { factoryRegistry } from '../factories'
import {
  Block as BlockState,
  DatabaseInterface,
  InteractionMode,
} from './interfaces'
import { PubSub } from './lib/pubsub'
import { Block } from './components/Block'
import { useAnimationFrame } from './useAnimationFrame'
import { vecAdd } from './lib/utils'

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

interface Props {
  db: DatabaseInterface
}

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
})

export function App(props: Props): JSX.Element {
  const { db } = props

  const messageBus = useMemo(() => new PubSub(), [])
  const appStateReducer = useCallback(createReducer(db), [])
  const initialState = useMemo(() => loadAppState(db), [])
  const [state, dispatchAction] = useReducer(appStateReducer, initialState)
  const overlayRef = useRef<HTMLDivElement>(null)

  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal => {
      return ReactDOM.createPortal(children, overlayRef.current)
    },
    [overlayRef.current]
  )

  const actionQueueRef = useRef<Action[]>([])
  useAnimationFrame(() => {
    const aggregatedMoveActions: { [key: string]: Action } = {}
    actionQueueRef.current.forEach(a => {
      if (a.type === 'ref::move') {
        if (aggregatedMoveActions[a.data.id]) {
          aggregatedMoveActions[a.data.id] = {
            ...aggregatedMoveActions[a.data.id],
            movementInViewportCoords: vecAdd(
              aggregatedMoveActions[a.data.id].movementInViewportCoords,
              a.data.movementInViewportCoords
            ),
          }
        } else {
          aggregatedMoveActions[a.data.id] = a.data
        }
      }
    })

    Object.values(aggregatedMoveActions).forEach(a =>
      dispatchAction({
        type: 'ref::move',
        data: a,
      })
    )
    actionQueueRef.current
      .filter(a => a.type !== 'ref::move')
      .forEach(action => dispatchAction(action))
    actionQueueRef.current = []
  })

  const scheduleActionForAnimationFrame = useCallback(
    (action: Action) => actionQueueRef.current.push(action),
    []
  )

  const renderBlock = (block: BlockState): JSX.Element => {
    const key = 'Block-' + block.refId

    const setMode = (mode: InteractionMode) => {
      dispatchAction({
        type: 'block::change',
        data: {
          id: block.refId,
          changes: {
            mode,
          },
        },
      })
    }

    const conceptDisplay = factoryRegistry.createConceptDisplay(
      block.concept.summary.type,
      {
        readOnly: block.mode === InteractionMode.Moving,
        viewMode: 'Block',
        concept: block.concept,
        messageBus,
        state,
        dispatchAction,
        factoryRegistry,
        database: db,
        onChange: content => {
          dispatchAction({
            type: 'concept::datachange',
            data: {
              id: block.concept.id,
              type: block.concept.summary.type,
              content,
            },
          })
        },
        onReplace: type => {
          dispatchAction({
            type: 'concept::datachange',
            data: {
              id: block.concept.id,
              type,
              content: { initialized: false },
            },
          })
        },
        onInteractionStart: () => {
          setMode(InteractionMode.Focusing)
        },
        onInteractionEnd: () => {
          setMode(InteractionMode.Idle)
        },
        createOverlay,
      }
    )

    return (
      <Block
        key={key}
        block={block}
        dispatchAction={dispatchAction}
        scheduleActionForAnimationFrame={scheduleActionForAnimationFrame}>
        {conceptDisplay}
      </Block>
    )
  }

  return (
    <div className={styles.App}>
      <Overlay ref={overlayRef} />
      <Viewport
        focus={state.camera.focus}
        scale={state.camera.scale}
        blocks={state.blocks}
        renderBlock={renderBlock}
        dispatchAction={dispatchAction}
        scheduleActionForAnimationFrame={scheduleActionForAnimationFrame}
      />
    </div>
  )
}
