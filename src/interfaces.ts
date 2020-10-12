export interface Vec2 {
  x: number
  y: number
}

export interface UnifiedEventInfo {
  clientX: number
  clientY: number
  offsetX: number
  offsetY: number
}

export interface MessengerStatus {
  channels: {
    name: string
    subNum: number
  }[]
}

export interface BlockContentProps<T> {
  readOnly: boolean
  content: T
  onChange: (content: T) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}

/** Block. */
export interface BlockModel<T> {
  id: string
  type: string
  content: T
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
  content: unknown
  /** Below are details of the BlockCard. */
  drawing: Stroke[]
  blocks: {
    id: string
    position: Vec2
    width: number
  }[]
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

/** App state. */
export interface State {
  debugging: boolean
  blocks: {
    [id: string]: BlockModel<any>
  }
  canvas: Stroke[]
}