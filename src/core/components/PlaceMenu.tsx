import * as React from 'react'
import { useRef, useState, useEffect } from 'react'

import { Rect } from '../interfaces'

interface Props {
  near: Rect
  children?: React.ReactNode
}

/** TODO: ResizeObserver */
export function PlaceMenu(props: Props): JSX.Element {
  const { near, children } = props
  const rContainerEl = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState(false)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    left?: number
    right?: number
  }>({
    top: 0,
    left: 0,
  })

  useEffect(() => {
    if (!rContainerEl.current) return

    const winW = window.innerWidth
    const winH = window.innerHeight
    const menuRect = rContainerEl.current.getBoundingClientRect()
    const topOrBottom = (() => {
      if (near.bottom + menuRect.height > winH) {
        return { bottom: winH - near.top }
      } else {
        return { top: near.bottom }
      }
    })()
    const leftOrRight = (() => {
      if (near.right + menuRect.width > winW) {
        return { right: winW - near.right }
      } else {
        return { left: near.right }
      }
    })()
    setPosition({ ...topOrBottom, ...leftOrRight })
    setMeasured(true)
  }, [near])

  return (
    <div
      ref={rContainerEl}
      style={{
        position: 'absolute',
        ...position,
        visibility: measured ? 'visible' : 'hidden',
      }}>
      {children}
    </div>
  )
}
