export interface Vec2 {
  x: number
  y: number
}

export interface Size {
  w: number | 'auto'
  h: number | 'auto'
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
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

export interface Camera {
  focus: Vec2
  scale: number
}

export type Timestamp = number

export enum Entity {
  Concept = 'concept',
  Block = 'block',
  View = 'view',
}
