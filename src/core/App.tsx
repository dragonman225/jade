/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState, useContext } from 'react'
import { classes } from 'typestyle'

import { AppStyles } from './App.styles'
import { useAnimationFrame } from './useAnimationFrame'
import { Arrow } from './components/Arrow'
import { Blocks } from './components/Blocks'
import { CanvasInteractionDetector } from './components/CanvasInteractionDetector'
import { PinnedPositioned } from './components/PinnedPositioned'
import { NormalPositioned } from './components/NormalPositioned'
import { ViewObject } from './components/ViewObject'
import { Overlay } from './components/Overlay'
import { PlaceMenu } from './components/PlaceMenu'
import { ContextMenu } from './components/ContextMenu'
import { AppStateContext } from './store/appStateContext'
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
import { blockRectManager } from './utils/element-pool'
import { blockToBox, findBlock } from './utils/block'
import { SystemContext } from './store/systemContext'

const zeroSize = { w: 0, h: 0 }

const App = React.memo(function App() {
  const state = useContext(AppStateContext)
  const { dispatchAction, createOverlay } = useContext(SystemContext)
  const notifyBlocksRendered = useCallback(() => {
    dispatchAction({ type: Action.BlocksRendered })
  }, [dispatchAction])

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

    return state.blocks.filter(b => {
      const rect = blockRectManager.getRect(b.id)

      return (
        b.posType === PositionType.Normal &&
        /**
         * If a Block haven't reported its rect, render it anyway so it can
         * report. Usually this happens when opening a Canvas and
         * double-clicking to create a new Block + Concept.
         */
        (!rect ||
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
  }, [state.blocks, state.camera])

  const pinnedBlocks = state.blocks.filter(b => b.posType > PositionType.Normal)

  const contextMenuDesiredRect: Rect = useMemo(
    () => ({
      top: state.contextMenuPos.y,
      left: state.contextMenuPos.x,
      bottom: state.contextMenuPos.y,
      right: state.contextMenuPos.x,
    }),
    [state.contextMenuPos]
  )

  return (
    <div
      className={classes(
        AppStyles.App,
        state.blocks.find(b => b.mode === InteractionMode.Moving) &&
          AppStyles['App--BlockMoving']
      )}>
      <CanvasInteractionDetector dispatchAction={dispatchAction}>
        <NormalPositioned
          focus={state.camera.focus}
          scale={state.camera.scale}
          selecting={state.selecting}
          selectionBox={state.selectionBox}>
          {state.blocksRendered &&
            state.relations.map(relation => {
              const fromBox = blockToBox(
                findBlock(state.blocks, relation.fromId)
              )
              const toBox = blockToBox(findBlock(state.blocks, relation.toId))
              const viewBox = growBox(boundingBoxOfBoxes([fromBox, toBox]), 10)

              return (
                <ViewObject
                  key={`vo-r-${relation.id}`}
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
            })}
          <Blocks
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
              const fromBox = blockToBox(
                findBlock(state.blocks, state.drawingRelationFromBlockId)
              )
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
        <Blocks blocks={pinnedBlocks} />
      </PinnedPositioned>
      {state.shouldShowContextMenu &&
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

  const appStateReducer = useMemo(
    () => createAppStateReducer(db, factoryRegistry),
    [db, factoryRegistry]
  )
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
  const overlayRef = useRef<HTMLDivElement>(null)
  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal => {
      return ReactDOM.createPortal(children, overlayRef.current)
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
      <Overlay ref={overlayRef} />
    </>
  )
}
