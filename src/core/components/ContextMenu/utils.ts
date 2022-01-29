import { Context, ContextMenuType } from './types'
import {
  AppState,
  ContextMenuActionData,
  ContextType,
  RelationId,
} from '../../interfaces'
import { viewportCoordsToEnvCoords } from '../../utils'
import { getOverBlock } from '../../utils/block'

export function getContextOfPointer(
  appState: AppState,
  actionData: ContextMenuActionData
): Context | undefined {
  const { camera, blocks } = appState
  const pointerInEnvCoords = viewportCoordsToEnvCoords(
    actionData.pointerInViewportCoords,
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

export function getContextOfRelation(
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

export function getContext(
  appState: AppState,
  actionData: ContextMenuActionData
): Context | undefined {
  switch (actionData.contextType) {
    case ContextType.InferFromPointer: {
      return getContextOfPointer(appState, actionData)
    }
    case ContextType.Relation: {
      return getContextOfRelation(appState, actionData.relationId)
    }
  }
}
