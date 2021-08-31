/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState, useContext } from 'react'
import { classes, style } from 'typestyle'

import { Viewport } from './components/Viewport'
import { Overlay } from './components/Overlay'
import { Block } from './components/Block'
import { PinnedLayer } from './components/PinnedLayer'
import { NormalLayer } from './components/NormalLayer'
import { ViewObject } from './components/ViewObject'
import { AppStyles } from './App.styles'
import { AppStateContext } from './store/appStateContext'
import theme from '../theme'
import { useAnimationFrame } from './useAnimationFrame'
import { createReducer, loadAppState } from './store/reducer'
import {
  AppState,
  BlockInstance,
  Concept,
  DatabaseInterface,
  FactoryRegistry,
  InteractionMode,
  PositionType,
} from './interfaces'
import { Action, Actions } from './store/actions'
import { isBoxBoxIntersectingObjVer } from './utils'
import { getElementRect } from './utils/element-pool'

interface BlockDriverProps {
  block: BlockInstance
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
  createOverlay: (children: React.ReactNode) => React.ReactPortal
}

// const debugBlockStyle = { height: 50 }
// const Debug = React.memo(function Debug() {
//   return <div style={debugBlockStyle} />
// })

const BlockDriver = React.memo(function BlockDriver(
  props: BlockDriverProps
): JSX.Element {
  const { block, db, factoryRegistry, dispatchAction, createOverlay } = props

  const setMode = useCallback(
    (mode: InteractionMode) => {
      dispatchAction({
        type: Action.BlockSetMode,
        data: {
          id: block.id,
          mode,
        },
      })
    },
    [block.id, dispatchAction]
  )

  const handleChange = useCallback(
    (content: unknown) => {
      dispatchAction({
        type: Action.ConceptWriteData,
        data: {
          id: block.concept.id,
          type: block.concept.summary.type,
          content,
        },
      })
    },
    [block.concept.id, block.concept.summary.type, dispatchAction]
  )

  const handleReplace = useCallback(
    (type: string) => {
      dispatchAction({
        type: Action.ConceptWriteData,
        data: {
          id: block.concept.id,
          type,
          content: { initialized: false },
        },
      })
    },
    [block.concept.id, dispatchAction]
  )

  const handleInteractionStart = useCallback(() => {
    setMode(InteractionMode.Focusing)
  }, [setMode])

  const handleInteractionEnd = useCallback(() => {
    setMode(InteractionMode.Idle)
  }, [setMode])

  const blockClassName = useMemo(() => {
    return block.posType > PositionType.Normal
      ? style({
          boxShadow: theme.shadows.ui,
          borderRadius: theme.borders.largeRadius,
        })
      : undefined
  }, [block.posType])

  return (
    <Block
      id={block.id}
      conceptId={block.concept.id}
      mode={block.mode}
      selected={block.selected}
      highlighted={block.highlighted}
      blink={Concept.isHighOrder(block.concept)}
      dispatchAction={dispatchAction}
      className={blockClassName}>
      {factoryRegistry.createConceptDisplay(block.concept.summary.type, {
        readOnly: block.mode === InteractionMode.Moving,
        viewMode: 'Block',
        concept: block.concept,
        dispatchAction,
        factoryRegistry,
        database: db,
        onChange: handleChange,
        onReplace: handleReplace,
        onInteractionStart: handleInteractionStart,
        onInteractionEnd: handleInteractionEnd,
        createOverlay,
      })}
      {/* <Debug /> */}
    </Block>
  )
})

interface AppProps {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
}

const App = React.memo(function App(props: AppProps) {
  const { db, factoryRegistry, dispatchAction } = props
  const state = useContext(AppStateContext)

  const overlayRef = useRef<HTMLDivElement>(null)
  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal => {
      return ReactDOM.createPortal(children, overlayRef.current)
    },
    []
  )

  const normalBlocks = useMemo(() => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const overscanX = windowWidth * 0.125
    const overscanY = windowHeight * 0.125
    const visibleArea = {
      x: state.camera.focus.x - overscanX,
      y: state.camera.focus.y - overscanY,
      w: windowWidth / state.camera.scale + 2 * overscanX,
      h: windowHeight / state.camera.scale + 2 * overscanY,
    }

    return state.blocks.filter(
      b =>
        b.posType === PositionType.Normal &&
        /**
         * If a Block haven't reported its rect, render it anyway so it can
         * report. Usually this happens when opening a Canvas and
         * double-clicking to create a new Block + Concept.
         */
        (!getElementRect(b.id) ||
          isBoxBoxIntersectingObjVer(
            {
              ...b.pos,
              w:
                typeof b.size.w === 'number'
                  ? b.size.w
                  : getElementRect(b.id).width,
              h:
                typeof b.size.h === 'number'
                  ? b.size.h
                  : getElementRect(b.id).height,
            },
            visibleArea
          ))
    )
  }, [state.blocks, state.camera])

  const pinnedBlocks = state.blocks.filter(b => b.posType > PositionType.Normal)

  return (
    <div
      className={classes(
        AppStyles.App,
        state.blocks.find(b => b.mode === InteractionMode.Moving)
          ? AppStyles['App--BlockMoving']
          : undefined
      )}>
      <Viewport dispatchAction={dispatchAction}>
        <NormalLayer
          focus={state.camera.focus}
          scale={state.camera.scale}
          selecting={state.selecting}
          selectionBox={state.selectionBox}>
          {normalBlocks.map(b => (
            <ViewObject
              key={`vo--${b.id}`}
              posType={b.posType}
              pos={b.pos}
              size={b.size}>
              <BlockDriver
                block={b}
                db={db}
                factoryRegistry={factoryRegistry}
                dispatchAction={dispatchAction}
                createOverlay={createOverlay}
              />
            </ViewObject>
          ))}
        </NormalLayer>
      </Viewport>
      <PinnedLayer>
        {pinnedBlocks.map(b => (
          <ViewObject
            key={`vo--${b.id}`}
            posType={b.posType}
            pos={b.pos}
            size={b.size}>
            <BlockDriver
              block={b}
              db={db}
              factoryRegistry={factoryRegistry}
              dispatchAction={dispatchAction}
              createOverlay={createOverlay}
            />
          </ViewObject>
        ))}
      </PinnedLayer>
      <Overlay ref={overlayRef} />
    </div>
  )
})

interface AppRootProps {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
}

export function AppRoot(props: AppRootProps): JSX.Element {
  const { db, factoryRegistry } = props

  const appStateReducer = useMemo(() => createReducer(db, factoryRegistry), [
    db,
    factoryRegistry,
  ])
  const initialState = useMemo(() => loadAppState(db), [db])
  const [stateSnapshot, setStateSnapshot] = useState<AppState>(initialState)
  const stateRef = useRef<AppState>(initialState)
  const dispatchAction = useCallback<(action: Actions) => void>(
    action => {
      stateRef.current = appStateReducer(stateRef.current, action)
    },
    [appStateReducer]
  )
  useAnimationFrame(() => {
    setStateSnapshot(stateRef.current)
  })

  return (
    <AppStateContext.Provider value={stateSnapshot}>
      <App
        db={db}
        factoryRegistry={factoryRegistry}
        dispatchAction={dispatchAction}
      />
    </AppStateContext.Provider>
  )
}
