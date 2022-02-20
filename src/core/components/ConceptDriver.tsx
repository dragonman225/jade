import * as React from 'react'
import { useCallback } from 'react'
import { style } from 'typestyle'

import { ConceptLoader } from './ConceptLoader'
import { useSystem } from '../store/systemContext'
import { BlockInstance, InteractionMode, TypedConcept } from '../interfaces'
import { Action } from '../store/actions'

interface ConceptDisplayProps {
  block: BlockInstance
  concept: TypedConcept<unknown>
}

export const ConceptDisplay = React.memo(function ConceptDisplay({
  block,
  concept,
}: ConceptDisplayProps) {
  const { db, dispatchAction, factoryRegistry } = useSystem()

  const setInteractionMode = useCallback(
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

  const onInteractionStart = useCallback(() => {
    setInteractionMode(InteractionMode.Focusing)
  }, [setInteractionMode])

  const onInteractionEnd = useCallback(() => {
    setInteractionMode(InteractionMode.Idle)
  }, [setInteractionMode])

  const onChange = useCallback(
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

  const onReplace = useCallback(
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

  return factoryRegistry.createConceptDisplay(concept.summary.type, {
    readOnly: block.mode === InteractionMode.Moving,
    viewMode: 'Block',
    concept,
    blockId: block.id,
    dispatchAction,
    factoryRegistry,
    database: db,
    onChange,
    onReplace,
    onInteractionStart,
    onInteractionEnd,
  })
})

interface ConceptDriverProps {
  block: BlockInstance
  concept: TypedConcept<unknown> | undefined
}

const conceptLoaderWrapper = style({
  width: '100%',
  height: '100%',
  minWidth: 48,
  minHeight: 48,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export const ConceptDriver = React.memo(function ConceptDriver({
  block,
  concept,
}: ConceptDriverProps) {
  return concept ? (
    <ConceptDisplay block={block} concept={concept} />
  ) : (
    <div className={conceptLoaderWrapper}>
      <ConceptLoader />
    </div>
  )
})
