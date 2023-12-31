import { v4 as uuidv4 } from 'uuid'

import { BlockInstance, Entity, Relation, SimpleRelation } from '../interfaces'

export function createSimpleRelation(
  properties: Omit<SimpleRelation, 'id' | 'userData'>
): SimpleRelation {
  return {
    ...properties,
    id: uuidv4(),
    userData: undefined,
  }
}

export function isRelationExists(
  relations: Relation<unknown>[],
  properties: Omit<Relation<unknown>, 'id' | 'userData'>
): boolean {
  return !!relations.find(
    r =>
      r.type === properties.type &&
      r.fromEntity === properties.fromEntity &&
      r.fromId === properties.fromId &&
      r.toEntity === properties.toEntity &&
      r.toId === properties.toId
  )
}

export function isBlockToBlockInCanvasRelation(
  relation: Relation<unknown>
): boolean {
  return (
    relation.type === 'block-to-block-in-canvas' &&
    relation.fromEntity === Entity.Block &&
    relation.toEntity === Entity.Block
  )
}

export function removeInvalidRelations(
  relations: Relation<unknown>[],
  blocks: BlockInstance[]
): Relation<unknown>[] {
  const blockIds = blocks.map(b => b.id)
  return relations.filter(
    r => blockIds.includes(r.fromId) && blockIds.includes(r.toId)
  )
}
