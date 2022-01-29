import { useRef, useEffect, useCallback } from 'react'

import { Vec2 } from '../interfaces'
import { getUnifiedClientCoords, distanceOf } from '.'

export type SyntheticFocusCallbackFn = (event: {
  clientX: number
  clientY: number
  target: EventTarget | null
}) => void

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
  onPointerDownOutside,
  clickRadius = 3,
  externalHasFocus,
}: {
  onFocus?: SyntheticFocusCallbackFn
  onBlur?: SyntheticFocusCallbackFn
  onPointerDownOutside?: SyntheticFocusCallbackFn
  /** If the pointer doesn't leave this circle between down and up, it's a click. */
  clickRadius?: number
  /** Provide `hasFocus` externally. */
  externalHasFocus?: boolean
}): {
  setNodeRef: (node: HTMLElement | null) => void
} {
  const elemRef = useRef<T | null>(null)
  const setNodeRef = useCallback((node: T | null) => {
    elemRef.current = node
  }, [])
  const down = useRef<Vec2 | undefined>(undefined)
  const moved = useRef(false)
  const hasFocus = useRef(externalHasFocus)

  useEffect(() => {
    function isInsideElem(node: Node) {
      return elemRef.current && elemRef.current.contains(node)
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      down.current = getUnifiedClientCoords(e)
      moved.current = false
      const isOutside = !isInsideElem(e.target as Node)
      const event = {
        clientX: down.current.x,
        clientY: down.current.y,
        target: e.target,
      }
      if (isOutside) {
        onPointerDownOutside && onPointerDownOutside(event)
      }
      if ((hasFocus.current || externalHasFocus) && isOutside) {
        hasFocus.current = false
        onBlur && onBlur(event)
      }

      if (e instanceof MouseEvent && e.button !== 0) return

      window.addEventListener('mousemove', onPointerMove)
      window.addEventListener('touchmove', onPointerMove)
      window.addEventListener('mouseup', onPointerUp)
      window.addEventListener('touchend', onPointerUp)
      window.addEventListener('touchcancel', onPointerUp)
    }

    function onPointerMove(e: MouseEvent | TouchEvent) {
      if (!down.current) return
      const here = getUnifiedClientCoords(e)
      const dist = distanceOf(down.current, here)
      if (dist > clickRadius) {
        moved.current = true
        onPointerUp(e) // no value to keep listening when already moved
      }
    }

    function onPointerUp(e: MouseEvent | TouchEvent) {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      window.removeEventListener('touchcancel', onPointerUp)

      const here = getUnifiedClientCoords(e)
      const isInside = isInsideElem(e.target as Node)
      if (
        (!hasFocus.current || !externalHasFocus) &&
        !moved.current &&
        isInside
      ) {
        hasFocus.current = true
        onFocus &&
          onFocus({
            clientX: here.x,
            clientY: here.y,
            target: e.target,
          })
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown)

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [onFocus, onBlur, onPointerDownOutside, clickRadius, externalHasFocus])

  return {
    setNodeRef,
  }
}
