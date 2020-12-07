import { BaseConceptData, Link, State3, Stroke } from '.'

/** Concept: Represent an idea of any type. */
export type ConceptId = string

export interface ConceptSummary {
  type: string
  data: BaseConceptData
}

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

export const Concept = {
  summary(concept: Concept): ConceptSummary {
    return concept.summary
  },

  details(concept: Concept, state: State3): Detail[] {
    return concept.details.map(link => {
      return {
        link,
        concept: state.conceptMap[link.to]
      }
    })
  }
}