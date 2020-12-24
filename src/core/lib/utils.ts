import { Vec2, Rect } from '../interfaces'

export function getMouseOffset(e: React.MouseEvent): Vec2 {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

export function isPointInRect(point: Vec2, domRect: Rect): boolean {
  return point.x > domRect.left && point.x < domRect.right
    && point.y > domRect.top && point.y < domRect.bottom
}