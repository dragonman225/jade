import { Vec2, Rect } from '../interfaces'

export function getMouseOffset(e: React.MouseEvent): Vec2 {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
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

export function viewportCoordsToEnvCoords(
  viewportCoords: Vec2,
  camFocus: Vec2,
  camScale: number
): Vec2 {
  return vecAdd(camFocus, vecDiv(viewportCoords, camScale))
}

interface CaretCoordinates {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}

export function getCaretCoordinates(r: Range): CaretCoordinates {
  if (r.collapsed && r.getClientRects) {
    const rect = r.getClientRects()[0]
    if (rect) {
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      }
    }
  } else if (r.getBoundingClientRect) {
    const rect = r.getBoundingClientRect()
    if (rect)
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      }
  }

  if (r.startContainer.nodeType === Node.ELEMENT_NODE) {
    if (0 === r.startOffset) {
      const rect = (r.startContainer as Element).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.left,
        width: 0,
        height: rect.height,
      }
    }

    const firstChild = r.startContainer.childNodes[r.startOffset - 1]
    if (firstChild && firstChild.nodeType === Node.ELEMENT_NODE) {
      const rect = (firstChild as Element).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.right,
        right: rect.right,
        width: 0,
        height: rect.height,
      }
    } else if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      /** This happens when typing the first character in a 
          ProseMirror editor. */
      const rect = (r.startContainer as Element).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.left,
        width: 0,
        height: rect.height,
      }
    }

    const secondChild = r.startContainer.childNodes[r.startOffset]
    if (secondChild && secondChild.nodeType === Node.ELEMENT_NODE) {
      const rect = (secondChild as Element).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.left,
        width: 0,
        height: rect.height,
      }
    }
  }

  console.log('util: cannot get caret coordinates')
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  }
}
