import { ConceptId, Concept, ReferenceId, PositionType } from './concept'
import { Box, Camera, Size, Vec2 } from './util'

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeConceptId: ConceptId // The user does not want to get lost!
  viewingConceptId: ConceptId
  conceptMap: {
    [id: string]: Concept
  }
}

export enum InteractionMode {
  Idle,
  Moving,
  Resizing,
  Focusing,
}

export interface Block {
  refId: ReferenceId
  conceptId: ConceptId
  posType: PositionType
  pos: Vec2
  size: Size
  mode: InteractionMode
  selected: boolean
  concept: Concept
}

/** App state v4. */
export interface State4 {
  /** Persistent, load from `DatabaseInterface.getSettings()`. */
  debugging: boolean
  /** Persistent, load from `DatabaseInterface.getSettings()`. */
  homeConceptId: ConceptId
  /** Persistent, load from `DatabaseInterface.getConcept()`. */
  viewingConcept: Concept
  /** Volatile. */
  expandHistory: (ConceptId | undefined)[]
  /** Volatile. */
  camera: Camera
  /** Volatile. */
  selecting: boolean
  selectionBoxStart: Vec2
  selectionBoxEnd: Vec2
  selectionBox: Box
  pointerStartOffset: Vec2
  /** Volatile. */
  selectedBlockIds: ReferenceId[]
  /** Volatile. */
  blocks: Block[]
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
