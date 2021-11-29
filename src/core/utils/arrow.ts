import { distanceOf, growBox, isPointInBox } from './math'
import { Box, Vec2 } from '../interfaces'

/** Information of an arrow. */
type ArrowDescriptor = [
  /** start point */
  sx: number,
  sy: number,
  /** control point for start point */
  c1x: number,
  c1y: number,
  /** control point for end point */
  c2x: number,
  c2y: number,
  /** end point */
  ex: number,
  ey: number,
  /** angle of end point */
  ae: number,
  /** angle of start point */
  as: number
]

type ArrowOptions = Partial<{
  padStart: number
  padEnd: number
}>

type Side = 'top' | 'right' | 'bottom' | 'left'

/**
 * Calculate control point.
 */
function controlPointOf(target: Vec2, another: Vec2, sideOfTarget: Side) {
  const margin = 30
  switch (sideOfTarget) {
    case 'top': {
      return {
        x: target.x,
        y: Math.min(target.y - (target.y - another.y) / 2, target.y - margin),
      }
    }
    case 'bottom': {
      return {
        x: target.x,
        y: Math.max(target.y - (target.y - another.y) / 2, target.y + margin),
      }
    }
    case 'left': {
      return {
        x: Math.min(target.x - (target.x - another.x) / 2, target.x - margin),
        y: target.y,
      }
    }
    case 'right': {
      return {
        x: Math.max(target.x - (target.x - another.x) / 2, target.x + margin),
        y: target.y,
      }
    }
  }
}

function angleOf(enteringSide: Side): number {
  switch (enteringSide) {
    case 'top':
      return 90
    case 'bottom':
      return 270
    case 'left':
      return 0
    default:
      return 180
  }
}

/**
 * Get the information to draw a perfect arrow between two boxes.
 * This function has the same interface as https://github.com/steveruizok/perfect-arrows
 * @see https://github.com/steveruizok/perfect-arrows#arguments-1 for the
 * meaning of the parameters.
 */
export function getBoxToBoxArrow(
  /** start box */
  x0: number,
  y0: number,
  w0: number,
  h0: number,
  /** end box */
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  clientOptions?: ArrowOptions
): ArrowDescriptor {
  const options = { padStart: 0, padEnd: 0, ...clientOptions }

  /** Points of start box. */
  const startBox = { x: x0, y: y0, w: w0, h: h0 }
  // const centerOfStartBox = centerPointOf(startBox)
  const startAtTop = {
    x: x0 + w0 / 2,
    y: y0 - 2 * options.padStart,
  }
  const startAtBottom = {
    x: x0 + w0 / 2,
    y: y0 + h0 + 2 * options.padStart,
  }
  const startAtLeft = {
    x: x0 - 2 * options.padStart,
    y: y0 + h0 / 2,
  }
  const startAtRight = {
    x: x0 + w0 + 2 * options.padStart,
    y: y0 + h0 / 2,
  }

  /** Points of end box. */
  const endBox = { x: x1, y: y1, w: w1, h: h1 }
  // const centerOfEndBox = centerPointOf(endBox)
  const endAtTop = { x: x1 + w1 / 2, y: y1 - 2 * options.padEnd }
  const endAtBottom = {
    x: x1 + w1 / 2,
    y: y1 + h1 + 2 * options.padEnd,
  }
  const endAtLeft = { x: x1 - 2 * options.padEnd, y: y1 + h1 / 2 }
  const endAtRight = {
    x: x1 + w1 + 2 * options.padEnd,
    y: y1 + h1 / 2,
  }

  const sides: Side[] = ['top', 'right', 'bottom', 'left']
  const startPoints = [startAtTop, startAtRight, startAtBottom, startAtLeft]
  const endPoints = [endAtTop, endAtRight, endAtBottom, endAtLeft]

  let shortestDistance = 1 / 0
  let bestStartPoint = startAtTop
  let bestEndPoint = endAtTop
  let bestStartSide: Side = 'top'
  let bestEndSide: Side = 'top'

  const keepOutZone = 15
  for (let startSideId = 0; startSideId < sides.length; startSideId++) {
    const startPoint = startPoints[startSideId]
    if (isPointInBox(startPoint, growBox(endBox, keepOutZone))) continue

    for (let endSideId = 0; endSideId < sides.length; endSideId++) {
      const endPoint = endPoints[endSideId]

      /**
       * If the start point is in the rectangle of end, or the end point
       * is in the rectangle of start, this combination is abandoned.
       */
      if (isPointInBox(endPoint, growBox(startBox, keepOutZone))) continue

      const d = distanceOf(startPoint, endPoint)
      if (d < shortestDistance) {
        shortestDistance = d
        bestStartPoint = startPoint
        bestEndPoint = endPoint
        bestStartSide = sides[startSideId]
        bestEndSide = sides[endSideId]
      }
    }
  }

  const controlPointForStartPoint = controlPointOf(
    bestStartPoint,
    bestEndPoint,
    bestStartSide
  )
  const controlPointForEndPoint = controlPointOf(
    bestEndPoint,
    bestStartPoint,
    bestEndSide
  )

  return [
    bestStartPoint.x,
    bestStartPoint.y,
    controlPointForStartPoint.x,
    controlPointForStartPoint.y,
    controlPointForEndPoint.x,
    controlPointForEndPoint.y,
    bestEndPoint.x,
    bestEndPoint.y,
    angleOf(bestEndSide),
    angleOf(bestStartSide),
  ]
}

export function getBoxToBoxArrowObjectVer(
  startBox: Box,
  endBox: Box,
  options: ArrowOptions
): ArrowDescriptor {
  return getBoxToBoxArrow(
    startBox.x,
    startBox.y,
    startBox.w,
    startBox.h,
    endBox.x,
    endBox.y,
    endBox.w,
    endBox.h,
    options
  )
}
