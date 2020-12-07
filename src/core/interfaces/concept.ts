import { State3, Vec2 } from '.'

/** Summary. */
export interface UninitializedConceptData {
  initialized: false
}

export interface InitializedConceptData {
  initialized: true
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

/** Link. */
export type LinkId = string

export interface Link {
  id: LinkId
  to: ConceptId
  type: 'contains'
  position: Vec2
  width: number
}

/** Concept: Represent an idea of any type. */
export type ConceptId = string

export interface Concept {
  id: ConceptId
  summary: ConceptSummary
  details: Link[]
  drawing: Stroke[]
}

type Detail = {
  link: Link
  concept: Concept
}

/** Concept Interface. */
export const Concept = {
  details(concept: Concept, state: State3): Detail[] {
    return concept.details.map(link => {
      return {
        link,
        concept: state.conceptMap[link.to]
      }
    })
  },

  isHighOrder(concept: Concept): boolean {
    return concept.details.length > 0
  },

  includesText(concept: Concept, text: string): boolean {
    /**
     * HACK: Each content type should be able to decide 
     * how to search its content!
     */
    return JSON.stringify(concept.summary.data)
      .toLocaleLowerCase().includes(text.toLocaleLowerCase())
  }
}