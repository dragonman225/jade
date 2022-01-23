/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState } from 'react'
import { classes } from 'typestyle'

import { appStyles } from './App.styles'
import { Arrow } from './components/Arrow'
import { ArrowList } from './components/ArrowList'
import { BlockList } from './components/BlockList'
import { CanvasInteractionDetector } from './components/CanvasInteractionDetector'
import { PinnedPositioned } from './components/PinnedPositioned'
import { NormalPositioned } from './components/NormalPositioned'
import { ViewObject } from './components/ViewObject'
import { Overlay } from './components/Overlay'
import { PlaceMenu } from './components/PlaceMenu'
import { ContextMenu } from './components/ContextMenu/ContextMenu'
import { AppStateContext, useAppState } from './store/appStateContext'
import { useSystem } from './store/systemContext'
import theme from '../theme'
import { createAppStateReducer, loadAppState } from './store/reducer'
import {
  AppState,
  DatabaseInterface,
  FactoryRegistry,
  InteractionMode,
  PositionType,
  Rect,
} from './interfaces'
import { Action, Actions } from './store/actions'
import {
  boundingBoxOfBoxes,
  growBox,
  isBoxBoxIntersectingObjVer,
} from './utils'
import { blockRectManager } from './utils/blockRectManager'
import { blockToBox, findBlock } from './utils/block'
import { SystemContext } from './store/systemContext'
import { useAnimationFrame } from './utils/useAnimationFrame'

const zeroSize = { w: 0, h: 0 }

const App = React.memo(function App() {
  const state = useAppState()
  const { dispatchAction, createOverlay } = useSystem()
  const notifyBlocksRendered = useCallback(() => {
    dispatchAction({ type: Action.BlocksRendered })
  }, [dispatchAction])

  blockRectManager.updateCamera(state.camera)

  const normalBlocks = useMemo(() => {
    /** Virtualized rendering wastes CPU time when zooming. */
    if (state.shouldAnimateCamera) {
      return state.blocks.filter(b => b.posType === PositionType.Normal)
    }

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const overscanX = windowWidth * 0.25
    const overscanY = windowHeight * 0.25
    const visibleArea = {
      x: state.camera.focus.x - overscanX,
      y: state.camera.focus.y - overscanY,
      w: windowWidth / state.camera.scale + 2 * overscanX,
      h: windowHeight / state.camera.scale + 2 * overscanY,
    }
    const rects = state.blocks.map(b => blockRectManager.getRect(b.id))

    return state.blocks.filter((b, index) => {
      const rect = rects[index]

      return (
        b.posType === PositionType.Normal &&
        /**
         * If a Block haven't reported its rect, render it anyway so it can
         * report. Usually this happens when opening a Canvas and
         * double-clicking to create a new Block + Concept.
         */
        (!rect ||
          !state.settings.shouldEnableEfficientRendering ||
          isBoxBoxIntersectingObjVer(
            {
              ...b.pos,
              w: typeof b.size.w === 'number' ? b.size.w : rect.width,
              h: typeof b.size.h === 'number' ? b.size.h : rect.height,
            },
            visibleArea
          ))
      )
    })
  }, [
    state.blocks,
    state.camera,
    state.settings.shouldEnableEfficientRendering,
    state.shouldAnimateCamera,
  ])

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
        state.isMovingBlocks && appStyles.movingBlocks,
        state.blocks.find(b => b.mode === InteractionMode.Resizing) &&
          appStyles.resizingBlocks,
        state.drawingRelation && appStyles.drawingRelation
      )}>
      <CanvasInteractionDetector dispatchAction={dispatchAction}>
        <NormalPositioned
          focus={state.camera.focus}
          scale={state.camera.scale}
          selecting={state.selecting}
          selectionBox={state.selectionBox}
          shouldAnimate={state.shouldAnimateCamera}>
          {state.blocksRendered && <ArrowList />}
          <BlockList
            /**
             * Use key to force unmount and re-mount on canvas switch, to
             * make sure `onRender` get called.
             */
            key={state.viewingConcept.id}
            blocks={normalBlocks}
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
      </CanvasInteractionDetector>
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
  const initialState = useMemo(() => loadAppState(db), [db])
  const [stateSnapshot, setStateSnapshot] = useState<AppState>(initialState)
  const stateRef = useRef<AppState>(initialState)
  /**
   * Need two timestamps. Consider this observed case:
   * start rendering frame -> dispatchAction, raise render flag
   * -> end rendering frame, clear render flag -> the state created by the
   * dispatchAction is missed
   */
  const lastStateChangeTimeRef = useRef(0)
  const lastFrameStartTimeRef = useRef(0)
  const dispatchAction = useCallback<(action: Actions) => void>(
    action => {
      stateRef.current = appStateReducer(stateRef.current, action)
      lastStateChangeTimeRef.current = Date.now()
    },
    [appStateReducer]
  )
  useAnimationFrame(() => {
    if (lastStateChangeTimeRef.current > lastFrameStartTimeRef.current) {
      lastFrameStartTimeRef.current = Date.now()
      setStateSnapshot(stateRef.current)
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

  return (
    <>
      <SystemContext.Provider value={system}>
        <AppStateContext.Provider value={stateSnapshot}>
          <App />
        </AppStateContext.Provider>
      </SystemContext.Provider>
      <Overlay ref={rOverlayEl} />
    </>
  )
}
