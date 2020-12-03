import { ISub } from './lib/pubsub'

export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  left: number   // min x
  right: number  // max x
  top: number    // min y
  bottom: number // max y
}

export interface OriginTopLeft {
  type: 'TL'
  top: number
  left: number
}

export interface OriginTopRight {
  type: 'TR'
  top: number
  right: number
}

export interface OriginBottomLeft {
  type: 'BL'
  bottom: number
  left: number
}

export interface OriginBottomRight {
  type: 'BR'
  bottom: number
  right: number
}

export type Origin =
  OriginTopLeft | OriginTopRight |
  OriginBottomLeft | OriginBottomRight

export interface UnifiedEventInfo {
  clientX: number
  clientY: number
  originX: number
  originY: number
  offsetX: number
  offsetY: number
}

export type PubSubAction = 'publish' | 'subscribe' | 'unsubscribe'

export interface PubSubStatusMessage {
  activeChannel: string
  action: PubSubAction
  channels: {
    name: string
    subNum: number
  }[]
}

/** Content API. */
export interface UninitializedConceptData {
  initialized: false
}

export interface InitializedConceptData {
  initialized: true
}

export type BaseConceptData = UninitializedConceptData | InitializedConceptData

export interface ContentProps<T extends InitializedConceptData> {
  readOnly: boolean
  viewMode: 'Block' | 'CardTitle' | 'NavItem'
  content: T | UninitializedConceptData
  messageBus: ISub
  onChange: (content: T) => void
  onReplace: (type: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}

/** Hand-drawing. */
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

/** Link: Connect Concepts to form a network. */
export type LinkId = string
export interface Link {
  id: LinkId
  type: string
  from: ConceptId
  to: ConceptId
  data?: unknown
}

export interface ContainsLink extends Link {
  type: 'contains'
  data: {
    position: Vec2
    width: number
  }
}

/** Concept: Represent an idea of any type. */
export type ConceptId = string
export interface Concept {
  id: ConceptId
  type: string
  data: BaseConceptData
  drawing: Stroke[]
  isMaterial: boolean
}

/** Material: A Concept with zero ContainsLink starting from. */
export interface Material extends Concept {
  isMaterial: true
}

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeConceptId: ConceptId // The user does not want to get lost!
  viewingConceptId: ConceptId
  conceptMap: {
    [id: string]: Concept
  }
  linkMap: {
    [id: string]: ContainsLink
  }
}