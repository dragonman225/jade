import { BlockId } from './block'
import { Concept, ConceptId, ConceptSummary, Stroke } from './concept'
import { Vec2 } from './util'

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeConceptId: ConceptId // The user does not want to get lost!
  viewingConceptId: ConceptId
  conceptMap: {
    [id: string]: Concept
  }
}

export interface Concept4 {
  id: ConceptId
  summary: ConceptSummary
  details: {
    id: BlockId
    to: ConceptId
    position: Vec2
    width: number
  }[]
  drawing: Stroke[]
}
