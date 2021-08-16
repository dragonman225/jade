import { Block, BlockId } from './block'
import { ConceptId, Stroke } from './concept'
import { Camera, Timestamp, Vec2 } from './util'

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeConceptId: ConceptId // The user does not want to get lost!
  viewingConceptId: ConceptId
  conceptMap: {
    [id: string]: LegacyConcept
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

/** Legacy summary contract. */
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
  data: Record<string, never> // An empty object.
}

export interface LegacyConcept {
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
