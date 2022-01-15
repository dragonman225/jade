import { useRef, useEffect, useCallback } from 'react'

import { Vec2 } from '../../core/interfaces'
import { getUnifiedClientCoords, distanceOf } from '../../core/utils'

type CallbackFn = () => void

/**
 * Synthesize focus and blur events for an arbitrary element.
 *
 * Focus: Real click (pointer down -> pointer move within a tolerable range
 *        -> pointer up) inside a node.
 *
 * Blur: Pointer down outside a node.
 */
export function useSyntheticFocus<T extends HTMLElement>({
  onFocus,
  onBlur,
  clickRadius = 3,
}: {
  onFocus: CallbackFn
  onBlur: CallbackFn
  /** If the pointer doesn't leave this circle between down and up, it's a click. */
  clickRadius?: number
}): {
  setNodeRef: (node: HTMLElement) => void
} {
  const elemRef = useRef<T>(null)
  const setNodeRef = useCallback((node: T) => {
    elemRef.current = node
  }, [])
  const down = useRef<Vec2>({ x: 0, y: 0 })
  const moved = useRef(false)
  const hasFocus = useRef(false)

  useEffect(() => {
    function isInsideElem(node: Node) {
      return elemRef.current && elemRef.current.contains(node)
    }

    function pointerDown(e: MouseEvent | TouchEvent) {
      down.current = getUnifiedClientCoords(e)
      moved.current = false
      const isOutside = !isInsideElem(e.target as Node)
      if (hasFocus.current && isOutside) {
        hasFocus.current = false
        onBlur()
      }
    }

    function pointerMove(e: MouseEvent | TouchEvent) {
      const curr = getUnifiedClientCoords(e)
      const dist = distanceOf(down.current, curr)
      if (dist > clickRadius) {
        moved.current = true
      }
    }

    function pointerUp(e: MouseEvent | TouchEvent) {
      const isInside = isInsideElem(e.target as Node)
      if (!hasFocus.current && !moved.current && isInside) {
        hasFocus.current = true
        onFocus()
      }
    }

    window.addEventListener('mousedown', pointerDown)
    window.addEventListener('touchstart', pointerDown)

    window.addEventListener('mouseup', pointerUp)
    window.addEventListener('touchend', pointerUp)
    window.addEventListener('touchcancel', pointerUp)
    window.addEventListener('mousemove', pointerMove)
    window.addEventListener('touchmove', pointerMove)

    return () => {
      window.removeEventListener('mousedown', pointerDown)
      window.removeEventListener('touchstart', pointerDown)

      window.removeEventListener('mouseup', pointerUp)
      window.removeEventListener('touchend', pointerUp)
      window.removeEventListener('touchcancel', pointerUp)
      window.removeEventListener('mousemove', pointerMove)
      window.removeEventListener('touchmove', pointerMove)
    }
  }, [onFocus, onBlur, clickRadius])

  return {
    setNodeRef,
  }
}
