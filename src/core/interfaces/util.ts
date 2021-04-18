export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  left: number // min x
  right: number // max x
  top: number // min y
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
  | OriginTopLeft
  | OriginTopRight
  | OriginBottomLeft
  | OriginBottomRight

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

export interface Camera {
  focus: Vec2
}
