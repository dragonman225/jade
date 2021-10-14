import * as React from 'react'
import { useCallback, useMemo, useContext, useState, useEffect } from 'react'
import { style } from 'typestyle'

import { Block } from './Block'
import { SystemContext } from '../store/systemContext'
import theme from '../../theme'
import {
  BlockInstance,
  Concept,
  InteractionMode,
  PositionType,
  TypedConcept,
} from '../interfaces'
import { Action } from '../store/actions'

interface BlockDriverProps {
  block: BlockInstance
}

export const BlockDriver = React.memo(function BlockDriver(
  props: BlockDriverProps
): JSX.Element {
  const { block } = props
  const { db, factoryRegistry, dispatchAction, createOverlay } = useContext(
    SystemContext
  )
  const [concept, setConcept] = useState<TypedConcept<unknown>>(() =>
    db.getConcept(block.conceptId)
  )

  /** Reactivity. */
  useEffect(() => {
    function handleUpdate() {
      setConcept(db.getConcept(concept.id))
    }

    db.subscribeConcept(concept.id, handleUpdate)

    return () => {
      db.unsubscribeConcept(concept.id, handleUpdate)
    }
  }, [concept.id, db])

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
          id: concept.id,
          type: concept.summary.type,
          content,
        },
      })
    },
    [concept.id, concept.summary.type, dispatchAction]
  )

  const handleReplace = useCallback(
    (type: string) => {
      dispatchAction({
        type: Action.ConceptWriteData,
        data: {
          id: concept.id,
          type,
          content: { initialized: false },
        },
      })
    },
    [concept.id, dispatchAction]
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
          boxShadow: theme.shadows.ui2,
          borderRadius: theme.borders.largeRadius,
          background: theme.colors.bgCanvasSemiTransparent,
          backdropFilter: 'saturate(180%) blur(30px)',
        })
      : undefined
  }, [block.posType])

  return (
    <Block
      id={block.id}
      conceptId={concept.id}
      color={block.color}
      mode={block.mode}
      selected={block.selected}
      highlighted={block.highlighted}
      blink={Concept.isHighOrder(concept)}
      allowResizeWidth={block.size.w !== 'auto'}
      allowResizeHeight={block.size.h !== 'auto'}
      dispatchAction={dispatchAction}
      className={blockClassName}>
      {factoryRegistry.createConceptDisplay(concept.summary.type, {
        readOnly: block.mode === InteractionMode.Moving,
        viewMode: 'Block',
        concept,
        blockId: block.id,
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
