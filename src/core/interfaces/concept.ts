import { Camera, Timestamp, Vec2 } from './util'
import { DatabaseInterface } from './core'
import { Block } from './block'

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
  drawing: Stroke[]
  camera: Camera
  createdTime: Timestamp
  lastEditedTime: Timestamp
}

/** Concept utils. */
export const Concept = {
  getSubConcepts(
    concept: TypedConcept<unknown>,
    db: DatabaseInterface
  ): TypedConcept<unknown>[] {
    return concept.references.map(ref => db.getConcept(ref.to)).filter(c => !!c)
  },

  isHighOrder(concept: TypedConcept<unknown>): boolean {
    return concept.references.length > 0
  },

  includesText(concept: TypedConcept<unknown>, text: string): boolean {
    /**
     * HACK: Each content type should be able to decide
     * how to search its content!
     */
    return JSON.stringify(concept.summary.data)
      .toLocaleLowerCase()
      .includes(text.toLocaleLowerCase())
  },
}
