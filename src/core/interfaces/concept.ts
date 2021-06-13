import { Camera, Size, Vec2 } from './util'
import { Block, DatabaseInterface, InteractionMode } from './core'

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

/** Reference: References a Concept in a Concept. */
export type ReferenceId = string

export enum PositionType {
  /** Not positioned, the `position` property has no meaning. */
  None,
  /** Position relative to environment origin. */
  Normal,
  /**
   * Position relative to viewport top-left, top-right, bottom-left,
   * bottom-right.
   */
  PinnedTL,
  PinnedTR,
  PinnedBL,
  PinnedBR,
}

export interface Reference {
  id: ReferenceId
  to: ConceptId
  posType: PositionType
  pos: Vec2
  size: Size
}

/** Concept: The container of an idea of any type. */
export type ConceptId = string

export interface Concept {
  id: ConceptId
  summary: ConceptSummary
  references: Reference[]
  drawing: Stroke[]
  camera: Camera
}

export interface ConceptDetail {
  reference: Reference
  concept: Concept
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

  toBlock(concept: Concept): Block {
    return {
      refId: undefined,
      conceptId: concept.id,
      posType: undefined,
      pos: undefined,
      size: undefined,
      mode: InteractionMode.Idle,
      selected: false,
      concept,
    }
  },
}

/** Reference utils. */
export const Reference = {
  toBlock(reference: Reference, db: DatabaseInterface): Block {
    return {
      refId: reference.id,
      conceptId: reference.to,
      posType: reference.posType,
      pos: reference.pos,
      size: reference.size,
      mode: InteractionMode.Idle,
      selected: false,
      concept: db.getConcept(reference.to),
    }
  },
}
