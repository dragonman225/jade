/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState } from 'react'
import { classes, style } from 'typestyle'

import { Viewport } from './components/Viewport'
import { Overlay } from './components/Overlay'
import { Block } from './components/Block'
import { AppStyles } from './App.styles'
import theme from '../theme'
import { useAnimationFrame } from './useAnimationFrame'
import { Action, createReducer, loadAppState } from './reducer'
import { factoryRegistry } from '../factories'
import {
  Block as BlockState,
  DatabaseInterface,
  InteractionMode,
  PositionType,
  State4,
} from './interfaces'

interface Props {
  db: DatabaseInterface
}

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
        className={
          block.posType > PositionType.Normal
            ? style({
                boxShadow: theme.SHADOWS.ui,
                borderRadius: theme.BORDERS.largeRadius,
              })
            : undefined
        }
        block={block}
        dispatchAction={dispatchAction}>
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
    <div
      className={classes(
        AppStyles.App,
        stateSnapshot.blocks.find(b => b.mode === InteractionMode.Moving)
          ? AppStyles['App--BlockMoving']
          : undefined
      )}>
      <Overlay ref={overlayRef} />
      <Viewport
        focus={stateSnapshot.camera.focus}
        scale={stateSnapshot.camera.scale}
        blocks={stateSnapshot.blocks}
        selecting={stateSnapshot.selecting}
        selectionBox={stateSnapshot.selectionBox}
        renderBlock={renderBlock}
        dispatchAction={dispatchAction}
      />
    </div>
  )
}
