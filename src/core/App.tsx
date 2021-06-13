/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState } from 'react'
import { cssRaw, stylesheet } from 'typestyle'

import { Viewport } from './components/Viewport'
import { Overlay } from './components/Overlay'
import { Action, createReducer, loadAppState } from './reducer'
import { factoryRegistry } from '../factories'
import {
  Block as BlockState,
  DatabaseInterface,
  InteractionMode,
  State4,
} from './interfaces'
import { Block } from './components/Block'
import { useAnimationFrame } from './useAnimationFrame'

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

  const appStateReducer = useCallback(createReducer(db), [])
  const initialState = useMemo(() => loadAppState(db), [])
  const [stateSnapshot, setStateSnapshot] = useState<State4>(initialState)
  const stateRef = useRef<State4>(initialState)
  const dispatchAction = useCallback<(action: Action) => void>(
    action => {
      stateRef.current = appStateReducer(stateRef.current, action)
    },
    [appStateReducer]
  )
  useAnimationFrame(() => {
    setStateSnapshot(stateRef.current)
  })

  const overlayRef = useRef<HTMLDivElement>(null)

  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal => {
      return ReactDOM.createPortal(children, overlayRef.current)
    },
    []
  )

  const renderBlock = (block: BlockState): JSX.Element => {
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

    return (
      <Block
        debug={stateSnapshot.debugging}
        block={block}
        dispatchAction={dispatchAction}
        scheduleActionForAnimationFrame={dispatchAction}>
        {factoryRegistry.createConceptDisplay(block.concept.summary.type, {
          readOnly: block.mode === InteractionMode.Moving,
          viewMode: 'Block',
          concept: block.concept,
          state: stateSnapshot,
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
        })}
      </Block>
    )
  }

  return (
    <div className={styles.App}>
      <Overlay ref={overlayRef} />
      <Viewport
        focus={stateSnapshot.camera.focus}
        scale={stateSnapshot.camera.scale}
        blocks={stateSnapshot.blocks}
        selecting={stateSnapshot.selecting}
        selectionBox={stateSnapshot.selectionBox}
        renderBlock={renderBlock}
        dispatchAction={dispatchAction}
        scheduleActionForAnimationFrame={dispatchAction}
      />
    </div>
  )
}
