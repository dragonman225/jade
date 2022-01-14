import * as React from 'react'

import { PositionType, Size, Vec2 } from '../interfaces'

interface Props {
  posType: PositionType
  pos: Vec2
  size: Size
  zIndex?: number
  children?: React.ReactNode
}

export function ViewObject({
  posType,
  pos,
  size,
  zIndex,
  children,
}: Props): JSX.Element {
  const resolvedZIndex = typeof zIndex === 'undefined' ? 'auto' : zIndex

  switch (posType) {
    /**
     * To render a "pinned block", first position it at its origin
     * (e.g. top-left, top-right) with `position`, `top`, `right`,
     * `bottom`, `left` properties, then translate it to the
     * correct location with `transform` property. Also, set its
     * `transformOrigin` appropriately.
     *
     * Note that for different position types, the positive
     * direction of axis are different.
     */
    case PositionType.PinnedTR: {
      return (
        <div
          style={{
            width: size.w,
            height: size.h,
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: resolvedZIndex,
            transformOrigin: 'top right',
            transform: `translate3d(${-pos.x}px, ${pos.y}px, 0px)`,
          }}>
          {children}
        </div>
      )
    }
    case PositionType.PinnedBL: {
      return (
        <div
          style={{
            width: size.w,
            height: size.h,
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: resolvedZIndex,
            transformOrigin: 'bottom left',
            transform: `translate3d(${pos.x}px, ${-pos.y}px, 0px)`,
          }}>
          {children}
        </div>
      )
    }
    case PositionType.PinnedBR: {
      return (
        <div
          style={{
            width: size.w,
            height: size.h,
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: resolvedZIndex,
            transformOrigin: 'bottom right',
            transform: `translate3d(${-pos.x}px, ${-pos.y}px, 0px)`,
          }}>
          {children}
        </div>
      )
    }
    default: {
      return (
        <div
          style={{
            width: size.w,
            height: size.h,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: resolvedZIndex,
            transformOrigin: 'top left',
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
          }}>
          {children}
        </div>
      )
    }
  }
}
