/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useMemo, useCallback, useRef, useState } from 'react'
import { classes, style } from 'typestyle'

import { Viewport } from './components/Viewport'
import { Overlay } from './components/Overlay'
import { Block } from './components/Block'
import { PinnedLayer } from './components/PinnedLayer'
import { NormalLayer } from './components/NormalLayer'
import { ViewObject } from './components/ViewObject'
import { AppStyles } from './App.styles'
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

interface Props {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
}

interface BlockDriverProps {
  block: BlockInstance
  db: DatabaseInterface
  state: AppState
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
  createOverlay: (children: React.ReactNode) => React.ReactPortal
}

function BlockDriver(props: BlockDriverProps): JSX.Element {
  const {
    block,
    db,
    state,
    factoryRegistry,
    dispatchAction,
    createOverlay,
  } = props

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
        state,
        dispatchAction,
        factoryRegistry,
        database: db,
        onChange: handleChange,
        onReplace: handleReplace,
        onInteractionStart: handleInteractionStart,
        onInteractionEnd: handleInteractionEnd,
        createOverlay,
      })}
    </Block>
  )
}

export function App(props: Props): JSX.Element {
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

    return stateSnapshot.blocks.filter(
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
            {
              x: stateSnapshot.camera.focus.x,
              y: stateSnapshot.camera.focus.y,
              w: windowWidth / stateSnapshot.camera.scale,
              h: windowHeight / stateSnapshot.camera.scale,
            }
          ))
    )
  }, [stateSnapshot.blocks, stateSnapshot.camera])

  const pinnedBlocks = stateSnapshot.blocks.filter(
    b => b.posType > PositionType.Normal
  )

  return (
    <div
      className={classes(
        AppStyles.App,
        stateSnapshot.blocks.find(b => b.mode === InteractionMode.Moving)
          ? AppStyles['App--BlockMoving']
          : undefined
      )}>
      <Viewport dispatchAction={dispatchAction}>
        <NormalLayer
          focus={stateSnapshot.camera.focus}
          scale={stateSnapshot.camera.scale}
          selecting={stateSnapshot.selecting}
          selectionBox={stateSnapshot.selectionBox}>
          {normalBlocks.map(b => (
            <ViewObject
              key={`vo--${b.id}`}
              posType={b.posType}
              pos={b.pos}
              size={b.size}>
              <BlockDriver
                block={b}
                db={db}
                state={stateSnapshot}
                factoryRegistry={factoryRegistry}
                dispatchAction={dispatchAction}
                createOverlay={createOverlay}
              />
              {/* <Block
                debug={stateSnapshot.debugging}
                className={
                  b.posType > PositionType.Normal
                    ? style({
                        boxShadow: theme.SHADOWS.ui,
                        borderRadius: theme.BORDERS.largeRadius,
                      })
                    : undefined
                }
                block={b}
                dispatchAction={dispatchAction}>
                <div style={{ height: 50 }} />
              </Block> */}
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
              state={stateSnapshot}
              factoryRegistry={factoryRegistry}
              dispatchAction={dispatchAction}
              createOverlay={createOverlay}
            />
            {/* <Block
                debug={stateSnapshot.debugging}
                className={
                  b.posType > PositionType.Normal
                    ? style({
                        boxShadow: theme.SHADOWS.ui,
                        borderRadius: theme.BORDERS.largeRadius,
                      })
                    : undefined
                }
                block={b}
                dispatchAction={dispatchAction}>
                <div style={{ height: 50 }} />
              </Block> */}
          </ViewObject>
        ))}
      </PinnedLayer>
      <Overlay ref={overlayRef} />
    </div>
  )
}
