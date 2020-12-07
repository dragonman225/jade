import { ISub } from '../../lib/pubsub'
import {
  Concept, ConceptId,
  InitializedConceptData, UninitializedConceptData
} from './concept'

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

/** Content Plugin Interface. */
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

/** App state v3. */
export interface State3 {
  debugging: boolean
  homeConceptId: ConceptId // The user does not want to get lost!
  viewingConceptId: ConceptId
  conceptMap: {
    [id: string]: Concept
  }
}