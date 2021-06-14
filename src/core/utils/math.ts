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

export function isPointInRect(point: Vec2, domRect: Rect): boolean {
  return (
    point.x > domRect.left &&
    point.x < domRect.right &&
    point.y > domRect.top &&
    point.y < domRect.bottom
  )
}

/** Calculate the distance of two points. */
export function distance(p1: Vec2, p2: Vec2): number {
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

export function isNaN(x: number): boolean {
  return x !== x
}
