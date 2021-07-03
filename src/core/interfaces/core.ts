import { BlockId, BlockInstance } from './block'
import { ConceptId, Concept } from './concept'
import { Box, Camera, Vec2 } from './util'

/** App state. */
export interface AppState {
  /** Loaded from `DatabaseInterface.getSettings()`. */
  debugging: boolean
  /** Loaded from `DatabaseInterface.getSettings()`. */
  homeConceptId: ConceptId
  /** Loaded from `DatabaseInterface.getConcept()`. */
  viewingConcept: Concept
  expandHistory: (ConceptId | undefined)[]
  camera: Camera
  selecting: boolean
  selectionBoxStart: Vec2
  selectionBoxEnd: Vec2
  selectionBox: Box
  pointerStartOffset: Vec2
  selectedBlockIds: BlockId[]
  blocks: BlockInstance[]
}

export interface Settings {
  debugging: boolean
  homeConceptId: ConceptId
  viewingConceptId: ConceptId
}

export interface DatabaseInterface {
  isValid(): boolean
  init(settings: Settings, concepts: Concept[]): void
  getConcept(id: ConceptId): Concept | undefined
  getAllConcepts(): Concept[]
  createConcept(concept: Concept): void
  updateConcept(concept: Concept): void
  getSettings(): Settings
  saveSettings(settings: Settings): void
  getLastUpdatedTime(): number
  getVersion(): number
  setVersion(number: number): void
}
