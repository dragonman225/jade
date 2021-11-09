import { Vec2, Rect, Camera, Box } from '../interfaces'

/** v1 + v2 */
export function vecAdd(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x + v2.x, y: v1.y + v2.y }
}

/** v1 - v2 */
export function vecSub(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x - v2.x, y: v1.y - v2.y }
}

/** v * n */
export function vecMul(v: Vec2, n: number): Vec2 {
  return { x: v.x * n, y: v.y * n }
}

/** v / n */
export function vecDiv(v: Vec2, n: number): Vec2 {
  return { x: v.x / n, y: v.y / n }
}

export function vecReverseX(v: Vec2): Vec2 {
  return { x: -v.x, y: v.y }
}

export function vecReverseY(v: Vec2): Vec2 {
  return { x: v.x, y: -v.y }
}

export function vecReverseXY(v: Vec2): Vec2 {
  return { x: -v.x, y: -v.y }
}

export function vecFloor(v: Vec2, fractionDigits: number): Vec2 {
  const multipiler = Math.pow(10, fractionDigits)
  return {
    x: Math.floor(v.x * multipiler) / multipiler,
    y: Math.floor(v.y * multipiler) / multipiler,
  }
}

export function boxFloor(box: Box, fractionDigits: number): Box {
  const multipiler = Math.pow(10, fractionDigits)
  return {
    x: Math.floor(box.x * multipiler) / multipiler,
    y: Math.floor(box.y * multipiler) / multipiler,
    w: Math.floor(box.w * multipiler) / multipiler,
    h: Math.floor(box.h * multipiler) / multipiler,
  }
}

export function isPointInRect(point: Vec2, domRect: Rect): boolean {
  return (
    point.x > domRect.left &&
    point.x < domRect.right &&
    point.y > domRect.top &&
    point.y < domRect.bottom
  )
}

/** Calculate the distance of two points. */
export function distanceOf(p1: Vec2, p2: Vec2): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

/** Test if two boxes are intersecting. From https://github.com/davidfig/intersects */
export function isBoxBoxIntersecting(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
}

export function isBoxBoxIntersectingObjVer(b1: Box, b2: Box): boolean {
  return isBoxBoxIntersecting(b1.x, b1.y, b1.w, b1.h, b2.x, b2.y, b2.w, b2.h)
}

/** Normalize two points to a box. */
export function normalizeToBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Box {
  return {
    x: x1 < x2 ? x1 : x2,
    y: y1 < y2 ? y1 : y2,
    w: Math.abs(x1 - x2),
    h: Math.abs(y1 - y2),
  }
}

/** Convert coords in the viewport to coords in the environment (canvas). */
export function viewportCoordsToEnvCoords(
  viewportCoords: Vec2,
  camera: Camera
): Vec2 {
  return vecAdd(camera.focus, vecDiv(viewportCoords, camera.scale))
}

export function viewportRectToEnvRect(
  viewportRect: Omit<DOMRect, 'toJSON'>,
  camera: Camera
): Omit<DOMRect, 'toJSON'> {
  const envCoords = viewportCoordsToEnvCoords(
    {
      x: viewportRect.x,
      y: viewportRect.y,
    },
    camera
  )
  const base = {
    x: envCoords.x,
    y: envCoords.y,
    width: viewportRect.width / camera.scale,
    height: viewportRect.height / camera.scale,
  }
  return {
    x: base.x,
    y: base.y,
    width: base.width,
    height: base.height,
    top: base.y,
    right: base.x + base.width,
    bottom: base.y + base.height,
    left: base.x,
  }
}

export function isNaN(x: number): boolean {
  return x !== x
}

export function getBoundingBox(rects: Rect[]): Rect {
  return {
    top: Math.min(...rects.map(r => r.top)),
    right: Math.max(...rects.map(r => r.right)),
    bottom: Math.max(...rects.map(r => r.bottom)),
    left: Math.min(...rects.map(r => r.left)),
  }
}

export function boundingBoxOfBoxes(boxes: Box[]): Box {
  const minX = Math.min(...boxes.map(b => b.x))
  const minY = Math.min(...boxes.map(b => b.y))
  return {
    x: minX,
    y: minY,
    w: Math.max(...boxes.map(b => b.x + b.w)) - minX,
    h: Math.max(...boxes.map(b => b.y + b.h)) - minY,
  }
}

export function centerPointOf(box: Box): Vec2 {
  return {
    x: box.x + box.w / 2,
    y: box.y + box.h / 2,
  }
}

/**
 * Convert a vector to polar coordinates.
 * Can be used to get theta.
 * @returns radius and theta (in degree)
 */
export function cartesianCoordsToPolarCoords(
  x: number,
  y: number
): [r: number, theta: number] {
  const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
  const theta =
    y < 0
      ? 360 - (Math.acos(x / r) / Math.PI) * 180
      : (Math.acos(x / r) / Math.PI) * 180
  return [r, theta]
}

/** Information of an arrow. */
type ArrowDescriptor = [
  sx: number,
  sy: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  ex: number,
  ey: number,
  ae: number,
  as: number
]

/**
 * Get the information to draw a perfect arrow between two boxes.
 * This function has the same interface as https://github.com/steveruizok/perfect-arrows
 * @see https://github.com/steveruizok/perfect-arrows#arguments-1 for the
 * meaning of the parameters.
 */
export function getBoxToBoxArrow(
  x0: number,
  y0: number,
  w0: number,
  h0: number,
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  arrowSize: number
): ArrowDescriptor {
  /** Points of from box. */
  const centerOfFromBox = centerPointOf({ x: x0, y: y0, w: w0, h: h0 })
  const midOfTopSideOfFromBox = { x: x0 + w0 / 2, y: y0 }
  const midOfBottomSideOfFromBox = { x: x0 + w0 / 2, y: y0 + h0 }
  const midOfLeftSideOfFromBox = { x: x0, y: y0 + h0 / 2 }
  const midOfRightSideOfFromBox = { x: x0 + w0, y: y0 + h0 / 2 }

  /** Points of to box. */
  const centerOfToBox = centerPointOf({ x: x1, y: y1, w: w1, h: h1 })
  const midOfTopSideOfToBox = { x: x1 + w1 / 2, y: y1 - 2 * arrowSize }
  const midOfBottomSideOfToBox = { x: x1 + w1 / 2, y: y1 + h1 + 2 * arrowSize }
  const midOfLeftSideOfToBox = { x: x1 - 2 * arrowSize, y: y1 + h1 / 2 }
  const midOfRightSideOfToBox = { x: x1 + w1 + 2 * arrowSize, y: y1 + h1 / 2 }

  /** Cartesian and polar coords. */
  const vec = vecSub(centerOfToBox, centerOfFromBox)
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
    const s = midOfRightSideOfFromBox
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfToBox)
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfToBox)
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfToBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (y1 + h1 < s.y) {
        if (eBottomScore > eLeftScore) return [midOfBottomSideOfToBox, 270]
      } else if (y1 > s.y) {
        if (eTopScore > eLeftScore) return [midOfTopSideOfToBox, 90]
      }
      return [midOfLeftSideOfToBox, 0]
    })()
    const as = 180
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else if (theta >= partitionDegree && theta < 180 - partitionDegree) {
    const s = midOfBottomSideOfFromBox
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfToBox)
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfToBox)
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfToBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (x1 + w1 < s.x) {
        if (eRightScore > eTopScore) return [midOfRightSideOfToBox, 180]
      } else if (x1 > s.x) {
        if (eLeftScore > eTopScore) return [midOfLeftSideOfToBox, 0]
      }
      return [midOfTopSideOfToBox, 90]
    })()
    const as = 270
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else if (theta >= 180 - partitionDegree && theta < 180 + partitionDegree) {
    const s = midOfLeftSideOfFromBox
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfToBox)
    const eTopScore = wellBalanceScoreOfPoints(s, midOfTopSideOfToBox)
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfToBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (y1 + h1 < s.y) {
        if (eBottomScore > eRightScore) return [midOfBottomSideOfToBox, 270]
      } else if (y1 > s.y) {
        if (eTopScore > eRightScore) return [midOfTopSideOfToBox, 90]
      }
      return [midOfRightSideOfToBox, 180]
    })()
    const as = 0
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  } else {
    const s = midOfTopSideOfFromBox
    const eBottomScore = wellBalanceScoreOfPoints(s, midOfBottomSideOfToBox)
    const eLeftScore = wellBalanceScoreOfPoints(s, midOfLeftSideOfToBox)
    const eRightScore = wellBalanceScoreOfPoints(s, midOfRightSideOfToBox)
    const [e, ae] = ((): [Vec2, 0 | 90 | 180 | 270] => {
      if (x1 + w1 < s.x) {
        if (eRightScore > eBottomScore) return [midOfRightSideOfToBox, 180]
      } else if (x1 > s.x) {
        if (eLeftScore > eBottomScore) return [midOfLeftSideOfToBox, 0]
      }
      return [midOfBottomSideOfToBox, 270]
    })()
    const as = 90
    const c1 = controlPointOf(s, e, as)
    const c2 = controlPointOf(e, s, ae)
    return [s.x, s.y, c1.x, c1.y, c2.x, c2.y, e.x, e.y, ae, as]
  }
}

export function getBoxToBoxArrowObjectVer(
  fromBox: Box,
  toBox: Box,
  arrowSize: number
): ArrowDescriptor {
  return getBoxToBoxArrow(
    fromBox.x,
    fromBox.y,
    fromBox.w,
    fromBox.h,
    toBox.x,
    toBox.y,
    toBox.w,
    toBox.h,
    arrowSize
  )
}

/**
 * @param box
 * @param size Add `size` to all edges.
 */
export function growBox(box: Box, size: number): Box {
  return {
    x: box.x - size,
    y: box.y - size,
    w: box.w + 2 * size,
    h: box.h + 2 * size,
  }
}

export function getFocusForBox(box: Box, scale: Camera['scale']): Vec2 {
  const center = centerPointOf(box)
  const winW = window.innerWidth
  const winH = window.innerHeight
  return {
    x: center.x - winW / 2 / scale,
    y: center.y - winH / 2 / scale,
  }
}
