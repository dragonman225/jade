import * as React from 'react'
import { useEffect, useRef } from 'react'

import { styles } from './ContextMenu.styles'
import { ContextMenuForBlock } from './ContextMenuForBlock'
import { ContextMenuForRelation } from './ContextMenuForRelation'
import { Context, ContextMenuType } from './types'
import { AppState, ContextType, RelationId } from '../../interfaces'
import { useAppState } from '../../store/appStateContext'
import { useSystem } from '../../store/systemContext'
import { Action } from '../../store/actions'
import { viewportCoordsToEnvCoords } from '../../utils'
import { getOverBlock } from '../../utils/block'

function getContextOfPointer(appState: AppState): Context | undefined {
  const { contextMenuState, camera, blocks } = appState
  const pointerInEnvCoords = viewportCoordsToEnvCoords(
    contextMenuState.pos,
    camera
  )
  const overBlock = getOverBlock(pointerInEnvCoords, blocks)

  if (overBlock) {
    return {
      type: ContextMenuType.Block,
      block: overBlock,
    }
  } else return undefined
}

function getContextOfRelation(
  appState: AppState,
  relationId: RelationId
): Context | undefined {
  const { viewingConcept, blocks } = appState
  const relation = viewingConcept.relations.find(r => relationId === r.id)
  if (!relation) return undefined
  const fromBlock = blocks.find(b => relation.fromId === b.id)
  const toBlock = blocks.find(b => relation.toId === b.id)
  return (
    fromBlock &&
    toBlock && {
      type: ContextMenuType.Relation,
      relation,
      fromBlock,
      toBlock,
    }
  )
}

function getContext(appState: AppState): Context | undefined {
  const { contextMenuState } = appState
  switch (contextMenuState.data.contextType) {
    case ContextType.InferFromPointer: {
      return getContextOfPointer(appState)
    }
    case ContextType.Relation: {
      return getContextOfRelation(appState, contextMenuState.data.relationId)
    }
  }
}

export function ContextMenu(): JSX.Element {
  const appState = useAppState()
  const { dispatchAction } = useSystem()
  const rContextMenuEl = useRef<HTMLDivElement>(null)
  const context = getContext(appState)

  /** Close ContextMenu when clicking outside or when window resize. */
  useEffect(() => {
    function closeContextMenu() {
      dispatchAction({ type: Action.ContextMenuClose })
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!rContextMenuEl.current?.contains(e.target as Node)) {
        closeContextMenu()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('resize', closeContextMenu)
    window.addEventListener('wheel', closeContextMenu)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('resize', closeContextMenu)
      window.removeEventListener('wheel', closeContextMenu)
    }
  }, [dispatchAction])

  if (!context) {
    return (
      <div className={styles.ContextMenu}>
        <div className={styles.Title}>
          Something is wrong. Cannot find entities to operate on.
        </div>
      </div>
    )
  }

  switch (context.type) {
    case ContextMenuType.Block: {
      return <ContextMenuForBlock ref={rContextMenuEl} context={context} />
    }
    case ContextMenuType.Relation: {
      return <ContextMenuForRelation ref={rContextMenuEl} context={context} />
    }
  }
}
