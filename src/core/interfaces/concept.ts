import { Camera, Timestamp, Vec2 } from './util'
import { DatabaseInterface } from './core'
import { Block } from './block'

/** Summary. */
export interface UninitializedConceptData {
  initialized: false
}

export interface InitializedConceptData {
  initialized: true
  data?: unknown
}

export type BaseConceptData = UninitializedConceptData | InitializedConceptData

export interface ConceptSummary {
  type: string
  data: BaseConceptData
}

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
export interface Concept {
  id: ConceptId
  summary: ConceptSummary
  // TODO: Create "Canvas" entity (fullscreen representation for a Concept)
  // to contain blocks, while a Concept holds references to Canvases,
  // and the active canvas.
  references: Block[]
  drawing: Stroke[]
  camera: Camera
  createdTime: Timestamp
  lastEditedTime: Timestamp
}

/** Concept utils. */
export const Concept = {
  getSubConcepts(concept: Concept, db: DatabaseInterface): Concept[] {
    return concept.references.map(ref => db.getConcept(ref.to)).filter(c => !!c)
  },

  isHighOrder(concept: Concept): boolean {
    return concept.references.length > 0
  },

  includesText(concept: Concept, text: string): boolean {
    /**
     * HACK: Each content type should be able to decide
     * how to search its content!
     */
    return JSON.stringify(concept.summary.data)
      .toLocaleLowerCase()
      .includes(text.toLocaleLowerCase())
  },
}
