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
