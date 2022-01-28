import Fuse from 'fuse.js'

import { BlockId, BlockInstance } from './block'
import { Clip } from './clipboard'
import { ConceptId, TypedConcept } from './concept'
import { ContextMenuState } from './contextMenu'
import { Relation } from './relation'
import { Box, Camera, Vec2 } from './util'

/** App state. */
export interface AppState {
  settings: Settings
  viewingConcept: TypedConcept<unknown>
  expandHistory: (ConceptId | undefined)[]
  camera: Camera
  /** Whether to animate camera if there's a camera change. */
  shouldAnimateCamera: boolean
  selecting: boolean
  selectionBoxStart: Vec2
  selectionBoxEnd: Vec2
  selectionBox: Box
  pointerOffsetInLeaderBox: Vec2
  selectedBlockIds: BlockId[]
  blocks: BlockInstance[]
  blocksRendered: boolean
  relations: Relation<unknown>[]
  drawingRelation: boolean
  drawingRelationFromBlockId: BlockId
  drawingRelationToPoint: Vec2 // in environment coords
  contextMenuState: ContextMenuState
  isMovingBlocks: boolean
  clipboard: Clip[]
}

export interface Settings {
  homeConceptId: ConceptId
  viewingConceptId: ConceptId
  shouldEnableEfficientRendering: boolean
  shouldEnableDevMode: boolean
}

export interface DatabaseInterface {
  isValid(): Promise<boolean>
  init(settings: Settings, concepts: TypedConcept<unknown>[]): Promise<void>
  getConcept(id: ConceptId): Promise<TypedConcept<unknown> | undefined>
  getAllConcepts(): Promise<TypedConcept<unknown>[]>
  createConcept(concept: TypedConcept<unknown>): void
  updateConcept(concept: TypedConcept<unknown>): void
  getSettings(): Settings
  saveSettings(settings: Settings): void
  getLastUpdatedTime(): number
  getVersion(): Promise<number>
  setVersion(number: number): void
  subscribeConcept: (
    conceptId: string,
    callback: (concept: TypedConcept<unknown> | undefined) => void
  ) => void
  unsubscribeConcept: (
    conceptId: string,
    callback: (concept: TypedConcept<unknown> | undefined) => void
  ) => void
  searchConceptByText: Fuse<TypedConcept<unknown>>['search']
}

export type PlatformDatabaseInterface = Omit<
  DatabaseInterface,
  'searchConceptByText'
>
