import { Entity } from './util'

/** An UUID identifying a *Relation*. */
export type RelationId = string

export interface Relation<T> {
  id: RelationId
  /** Used to find the executor. */
  type: string
  fromEntity: Entity
  fromId: string
  toEntity: Entity
  toId: string
  userData: T
}

export type SimpleRelation = Relation<undefined>
