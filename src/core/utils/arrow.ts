import { cartesianCoordsToPolarCoords, centerPointOf, vecSub } from './math'
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
  const centerOfStartBox = centerPointOf({ x: x0, y: y0, w: w0, h: h0 })
  const midOfTopSideOfStartBox = {
    x: x0 + w0 / 2,
    y: y0 - 2 * options.padStart,
  }
  const midOfBottomSideOfStartBox = {
    x: x0 + w0 / 2,
    y: y0 + h0 + 2 * options.padStart,
  }
  const midOfLeftSideOfStartBox = {
    x: x0 - 2 * options.padStart,
    y: y0 + h0 / 2,
  }
  const midOfRightSideOfStartBox = {
    x: x0 + w0 + 2 * options.padStart,
    y: y0 + h0 / 2,
  }

  /** Points of end box. */
  const centerOfEndBox = centerPointOf({ x: x1, y: y1, w: w1, h: h1 })
  const midOfTopSideOfEndBox = { x: x1 + w1 / 2, y: y1 - 2 * options.padEnd }
  const midOfBottomSideOfEndBox = {
    x: x1 + w1 / 2,
    y: y1 + h1 + 2 * options.padEnd,
  }
  const midOfLeftSideOfEndBox = { x: x1 - 2 * options.padEnd, y: y1 + h1 / 2 }
  const midOfRightSideOfEndBox = {
    x: x1 + w1 + 2 * options.padEnd,
    y: y1 + h1 / 2,
  }

  /** Cartesian and polar coords. */
  const vec = vecSub(centerOfEndBox, centerOfStartBox)
  const [_r, theta] = cartesianCoordsToPolarCoords(vec.x, vec.y)
  const [__r, partitionDegree] = cartesianCoordsToPolarCoords(w0, h0)

  /**
   * Calculate how balance a rectangle is.
   * Meaning of return value: (balanced) 1 <--> 0 (not balanced)
   */
  const wellBalanceScoreOfRectangle = (w: number, h: number) => {
    return Math.min(w, h) / Math.max(w, h)
  }

  const wellBalanceScoreOfPoints = (p1: Vec2, p2: Vec2) => {
    return wellBalanceScoreOfRectangle(
      Math.abs(p1.x - p2.x),
      Math.abs(p1.y - p2.y)
    )
  }

  /**
   * Calculate control point.
   */
  const controlPointOf = (
    target: Vec2,
    another: Vec2,
    enteringAngleToTarget: 0 | 90 | 180 | 270
  ) => {
    switch (enteringAngleToTarget) {
      case 0:
      case 180: {
        return {
          x: target.x - (target.x - another.x) / 2,
          y: target.y,
        }
      }
      case 90:
      case 270: {
        return {
          x: target.x,
          y: target.y - (target.y - another.y) / 2,
        }
      }
    }
  }

  if (
    (theta < partitionDegree && theta >= 0) ||
    theta > 360 - partitionDegree
  ) {
    const s = midOfRightSideOfStartBox
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfEndBox)
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfEndBox)
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfEndBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (y1 + h1 < s.y) {
        if (eBottomScore > eLeftScore) return [midOfBottomSideOfEndBox, 270]
      } else if (y1 > s.y) {
        if (eTopScore > eLeftScore) return [midOfTopSideOfEndBox, 90]
      }
      return [midOfLeftSideOfEndBox, 0]
    })()
    const as = 180
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else if (theta >= partitionDegree && theta < 180 - partitionDegree) {
    const s = midOfBottomSideOfStartBox
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfEndBox)
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfEndBox)
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfEndBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (x1 + w1 < s.x) {
        if (eRightScore > eTopScore) return [midOfRightSideOfEndBox, 180]
      } else if (x1 > s.x) {
        if (eLeftScore > eTopScore) return [midOfLeftSideOfEndBox, 0]
      }
      return [midOfTopSideOfEndBox, 90]
    })()
    const as = 270
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else if (theta >= 180 - partitionDegree && theta < 180 + partitionDegree) {
    const s = midOfLeftSideOfStartBox
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfEndBox)
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfEndBox)
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfEndBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (y1 + h1 < s.y) {
        if (eBottomScore > eRightScore) return [midOfBottomSideOfEndBox, 270]
      } else if (y1 > s.y) {
        if (eTopScore > eRightScore) return [midOfTopSideOfEndBox, 90]
      }
      return [midOfRightSideOfEndBox, 180]
    })()
    const as = 0
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else {
    const s = midOfTopSideOfStartBox
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfEndBox)
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfEndBox)
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfEndBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (x1 + w1 < s.x) {
        if (eRightScore > eBottomScore) return [midOfRightSideOfEndBox, 180]
      } else if (x1 > s.x) {
        if (eLeftScore > eBottomScore) return [midOfLeftSideOfEndBox, 0]
      }
      return [midOfBottomSideOfEndBox, 270]
    })()
    const as = 90
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  }
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
