import { BlockInstance, Relation, TypedConcept } from '../../interfaces'

export type ListOption = {
  title: string
  perform: () => void
  danger?: boolean
}

export enum ContextMenuType {
  Block,
  Relation,
}

export interface ContextForBlock {
  type: ContextMenuType.Block
  block: BlockInstance
  concept: TypedConcept<unknown>
}

export interface ContextForRelation {
  type: ContextMenuType.Relation
  relation: Relation<unknown>
  fromBlock: BlockInstance
  toBlock: BlockInstance
}

export type Context = ContextForBlock | ContextForRelation
