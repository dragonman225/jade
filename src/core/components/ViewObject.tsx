import * as React from 'react'
import { useMemo } from 'react'

import { PositionType, Size, Vec2 } from '../interfaces'

interface Props {
  className?: string
  posType: PositionType
  pos: Vec2
  size: Size
  zIndex?: number
  children?: React.ReactNode
}

export const ViewObject = React.memo(function ViewObject({
  className,
  posType,
  pos,
  size,
  zIndex,
  children,
}: Props): JSX.Element {
  const resolvedZIndex = typeof zIndex === 'undefined' ? 'auto' : zIndex
  /** These style causes long "Recalculate Style" when panning the camera,
   * even if they are not changing. */
  const style: React.CSSProperties = useMemo(() => {
    switch (posType) {
      /**
       * To render a "pinned block":
       *
       * 1. Position the block at the origin of the `posType` (e.g.
       *    top-left, top-right) with `position`, `top`, `right`, `bottom`,
       *    `left`.
       * 2. Translate the block to the final `pos` with `transform`. Also,
       *    set its `transformOrigin` properly.
       *
       * Note that for different position types, the positive direction of
       * the axes are different.
       */
      case PositionType.PinnedTR: {
        return {
          width: size.w,
          height: size.h,
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: resolvedZIndex,
          transformOrigin: 'top right',
          transform: `translate3d(${-pos.x}px, ${pos.y}px, 0px)`,
        }
      }
      case PositionType.PinnedBL: {
        return {
          width: size.w,
          height: size.h,
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: resolvedZIndex,
          transformOrigin: 'bottom left',
          transform: `translate3d(${pos.x}px, ${-pos.y}px, 0px)`,
        }
      }
      case PositionType.PinnedBR: {
        return {
          width: size.w,
          height: size.h,
          position: 'absolute',
          bottom: 0,
          right: 0,
          zIndex: resolvedZIndex,
          transformOrigin: 'bottom right',
          transform: `translate3d(${-pos.x}px, ${-pos.y}px, 0px)`,
        }
      }
      default: {
        return {
          width: size.w,
          height: size.h,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: resolvedZIndex,
          transformOrigin: 'top left',
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
        }
      }
    }
  }, [posType, size.w, size.h, pos.x, pos.y, resolvedZIndex])

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
})
