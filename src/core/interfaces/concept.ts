import { Camera, Timestamp, Vec2 } from './util'
import { DatabaseInterface } from './core'
import { Block } from './block'
import { Relation } from './relation'

/** Drawing. */
export type Point = Vec2

export interface StrokeConfig {
  lineWidth: number
  strokeStyle: string | CanvasGradient | CanvasPattern
  shadowBlur: number
  shadowColor: string
  compositeOperation: string
}

export interface Stroke {
  config: StrokeConfig
  points: Point[]
}

export type ConceptId = string

/** A Concept is a container for an idea of any type. */
export interface TypedConcept<T> {
  id: ConceptId
  summary: {
    type: string
    data: T
  }
  references: Block[]
  relations: Relation<unknown>[]
  drawing: Stroke[]
  camera: Camera
  createdTime: Timestamp
  lastEditedTime: Timestamp
}

/** Concept utils. */
export const Concept = {
  isHighOrder(concept: TypedConcept<unknown>): boolean {
    return concept.references.length > 0
  },
}
