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
export interface UninitializedContent {
  initialized: false
}

export interface InitializedContent {
  initialized: true
}

export type BaseContent = UninitializedContent | InitializedContent

export interface ContentProps<T extends InitializedContent> {
  readOnly: boolean
  viewMode: 'Block' | 'CardTitle' | 'NavItem'
  content: T | UninitializedContent
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
}

export interface Stroke {
  config: StrokeConfig
  points: Point[]
}

/** A reference to a BlockCard. */
export interface BlockCardRef {
  /** ID of the reference. */
  id: string
  /** ID of the referenced BlockCard. */
  to: string
  position: Vec2
  width: number
}

/**
 * A BlockCard has position and width only when it is in another BlockCard.
 */
export interface BlockCard {
  id: string
  /** Below are summary of the BlockCard. */
  type: string
  content: BaseContent
  /** Below are details of the BlockCard. */
  drawing: Stroke[]
  blocks: BlockCardRef[]
}

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeBlockCardId: string // The user does not want to get lost!
  currentBlockCardId: string
  blockCardMap: {
    [id: string]: BlockCard
  }
}