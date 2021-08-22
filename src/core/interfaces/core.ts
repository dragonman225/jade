import { BlockId, BlockInstance } from './block'
import { ConceptId, TypedConcept } from './concept'
import { Box, Camera, Vec2 } from './util'

/** App state. */
export interface AppState {
  /** Loaded from `DatabaseInterface.getSettings()`. */
  debugging: boolean
  /** Loaded from `DatabaseInterface.getSettings()`. */
  homeConceptId: ConceptId
  /** Loaded from `DatabaseInterface.getConcept()`. */
  viewingConcept: TypedConcept<unknown>
  expandHistory: (ConceptId | undefined)[]
  camera: Camera
  selecting: boolean
  selectionBoxStart: Vec2
  selectionBoxEnd: Vec2
  selectionBox: Box
  pointerOffsetInSelectionBoundingBox: Vec2
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
  init(settings: Settings, concepts: TypedConcept<unknown>[]): void
  getConcept(id: ConceptId): TypedConcept<unknown> | undefined
  getAllConcepts(): TypedConcept<unknown>[]
  createConcept(concept: TypedConcept<unknown>): void
  updateConcept(concept: TypedConcept<unknown>): void
  getSettings(): Settings
  saveSettings(settings: Settings): void
  getLastUpdatedTime(): number
  getVersion(): number
  setVersion(number: number): void
  subscribeConcept: (channel: string, callback: () => void) => void
  unsubscribeConcept: (channel: string, callback: () => void) => void
}
