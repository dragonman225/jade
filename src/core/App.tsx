/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { classes } from 'typestyle'

import { appStyles } from './App.styles'
import { Arrow } from './components/Arrow'
import { ArrowList } from './components/ArrowList'
import { BlockList } from './components/BlockList'
import { CanvasBase } from './components/CanvasBase'
import { ContextMenu } from './components/ContextMenu/ContextMenu'
import { EfficientBlockList } from './components/EfficientBlockList'
import { PinnedPositioned } from './components/PinnedPositioned'
import { NormalPositioned } from './components/NormalPositioned'
import { ViewObject } from './components/ViewObject'
import { Overlay } from './components/Overlay'
import { PlaceMenu } from './components/PlaceMenu'
import { AppStateContext, useAppState } from './store/appStateContext'
import { SettingsContext, useSettings } from './store/contexts'
import { SystemContext, useSystem } from './store/systemContext'
import { Action, Actions } from './store/actions'
import { createAppStateReducer, loadAppState } from './store/reducer'
import {
  AppState,
  BlockInstance,
  DatabaseInterface,
  FactoryRegistry,
  InteractionMode,
  PositionType,
  Rect,
} from './interfaces'
import { boundingBoxOfBoxes, growBox } from './utils'
import { blockRectManager } from './utils/blockRectManager'
import { blockToBox, findBlock, isMovingBlocks } from './utils/block'
import { useAnimationFrame } from './utils/useAnimationFrame'
import theme from '../theme'

const zeroSize = { w: 0, h: 0 }

const App = React.memo(function App() {
  const state = useAppState()
  const { dispatchAction, createOverlay } = useSystem()
  const settings = useSettings()
  const notifyBlocksRendered = useCallback(() => {
    dispatchAction({ type: Action.BlocksRendered })
  }, [dispatchAction])
  const normalBlockSelector = useCallback(
    (b: BlockInstance) => b.posType === PositionType.Normal,
    []
  )
  const pinnedBlocks = state.blocks.filter(b => b.posType > PositionType.Normal)

  const contextMenuDesiredRect: Rect = useMemo(
    () => ({
      top: state.contextMenuState.pos.y,
      left: state.contextMenuState.pos.x,
      bottom: state.contextMenuState.pos.y,
      right: state.contextMenuState.pos.x,
    }),
    [state.contextMenuState.pos]
  )

  return (
    <div
      className={classes(
        appStyles.app,
        isMovingBlocks(state.blocks) && appStyles.movingBlocks,
        state.blocks.find(b => b.mode === InteractionMode.Resizing) &&
          appStyles.resizingBlocks,
        state.drawingRelation && appStyles.drawingRelation
      )}>
      <CanvasBase dispatchAction={dispatchAction}>
        <NormalPositioned
          focus={state.camera.focus}
          scale={state.camera.scale}
          selecting={state.selecting}
          selectionBox={state.selectionBox}
          shouldAnimate={state.shouldAnimateCamera}>
          {state.blocksRendered && <ArrowList />}
          <EfficientBlockList
            /**
             * Use key to force unmount and re-mount on canvas switch, to
             * make sure `onRender` get called.
             */
            key={state.viewingConcept.id}
            blocks={state.blocks}
            camera={state.camera}
            shouldRenderOnlyVisible={settings.shouldEnableEfficientRendering}
            selectBlock={normalBlockSelector}
            onRender={notifyBlocksRendered}
          />
          {state.blocksRendered &&
            state.drawingRelation &&
            (() => {
              const fromBlock = findBlock(
                state.blocks,
                state.drawingRelationFromBlockId
              )
              if (!fromBlock) return

              const fromBox = blockToBox(fromBlock)
              const toBox = { ...state.drawingRelationToPoint, w: 0, h: 0 }
              const viewBox = growBox(boundingBoxOfBoxes([fromBox, toBox]), 10)

              return (
                <ViewObject
                  key={'drawingRelation'}
                  posType={PositionType.Normal}
                  pos={viewBox}
                  size={zeroSize}>
                  <Arrow
                    fromBox={fromBox}
                    toBox={toBox}
                    viewBox={viewBox}
                    color={theme.colors.uiPrimaryHarder}
                    size={theme.arrowSize}
                  />
                </ViewObject>
              )
            })()}
        </NormalPositioned>
      </CanvasBase>
      <PinnedPositioned>
        <BlockList blocks={pinnedBlocks} />
      </PinnedPositioned>
      {state.contextMenuState.shouldShow &&
        createOverlay(
          <PlaceMenu near={contextMenuDesiredRect}>
            <ContextMenu />
          </PlaceMenu>
        )}
    </div>
  )
})

interface AppRootProps {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  openExternal: (link: string) => void
}

export function AppRoot(props: AppRootProps): JSX.Element {
  const { db, factoryRegistry, openExternal } = props

  /** Render state on animation frame.  */
  const appStateReducer = useMemo(
    () => createAppStateReducer(db, factoryRegistry),
    [db, factoryRegistry]
  )

  const [stateSnapshot, setStateSnapshot] = useState<AppState>()
  const rNextState = useRef<AppState>()

  /**
   * Need two timestamps. Consider this observed case:
   * start rendering frame -> dispatchAction, raise render flag
   * -> end rendering frame, clear render flag -> the state created by the
   * dispatchAction is missed
   */
  const lastStateChangeTimeRef = useRef(0)
  const lastFrameStartTimeRef = useRef(0)

  /** Load initial state. */
  useEffect(() => {
    loadAppState(db)
      .then(state => {
        rNextState.current = state
        blockRectManager.updateCamera(state.camera)
        lastStateChangeTimeRef.current = Date.now()
      })
      .catch(error => {
        throw error
      })
  }, [db])

  /** Using a queue to ensure action ordering, since the reducer is async. */
  const pendingActions = useRef<Actions[]>([])
  const isFlushing = useRef(false)

  const flushActions = useCallback(async () => {
    isFlushing.current = true
    while (pendingActions.current.length) {
      const action = pendingActions.current.shift()
      if (rNextState.current && action) {
        rNextState.current = await appStateReducer(rNextState.current, action)
        blockRectManager.updateCamera(rNextState.current.camera)
      }
      lastStateChangeTimeRef.current = Date.now()
    }
    isFlushing.current = false
  }, [appStateReducer])

  const dispatchAction = useCallback<(action: Actions) => void>(
    action => {
      pendingActions.current.push(action)
      if (!isFlushing.current)
        flushActions().catch(error => {
          throw error
        })
    },
    [flushActions]
  )

  useAnimationFrame(() => {
    if (lastStateChangeTimeRef.current > lastFrameStartTimeRef.current) {
      lastFrameStartTimeRef.current = Date.now()
      setStateSnapshot(rNextState.current)
    }
  })

  const rOverlayEl = useRef<HTMLDivElement>(null)
  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal | null => {
      return (
        rOverlayEl.current &&
        ReactDOM.createPortal(children, rOverlayEl.current)
      )
    },
    []
  )
  const system = useMemo(
    () => ({
      db,
      factoryRegistry,
      dispatchAction,
      createOverlay,
      openExternal,
    }),
    [db, factoryRegistry, dispatchAction, createOverlay, openExternal]
  )

  return stateSnapshot ? (
    <>
      <SystemContext.Provider value={system}>
        <AppStateContext.Provider value={stateSnapshot}>
          <SettingsContext.Provider value={stateSnapshot.settings}>
            <App />
          </SettingsContext.Provider>
        </AppStateContext.Provider>
      </SystemContext.Provider>
      <Overlay ref={rOverlayEl} />
    </>
  ) : (
    <div>Starting App</div>
  )
}
