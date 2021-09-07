import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { style } from 'typestyle'

import { Block } from './Block'
import theme from '../../theme'
import {
  BlockInstance,
  Concept,
  DatabaseInterface,
  FactoryRegistry,
  InteractionMode,
  PositionType,
} from '../interfaces'
import { Actions, Action } from '../store/actions'

interface BlockDriverProps {
  block: BlockInstance
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
  createOverlay: (children: React.ReactNode) => React.ReactPortal
}

export const BlockDriver = React.memo(function BlockDriver(
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
          boxShadow: theme.shadows.float,
          borderRadius: theme.borders.largeRadius,
          background: 'hsl(42deg, 70%, 96%, 0.7)',
          backdropFilter: 'blur(100px)',
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
    </Block>
  )
})
