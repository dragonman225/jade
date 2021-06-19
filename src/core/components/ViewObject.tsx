import * as React from 'react'

import { PositionType, Size, Vec2 } from '../interfaces'

interface Props {
  posType: PositionType
  pos: Vec2
  size: Size
  children: JSX.Element
}

export function ViewObject(props: Props): JSX.Element {
  const { posType, pos, size, children } = props

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
            transformOrigin: 'top right',
            transform: `translate(${-pos.x}px, ${pos.y}px)`,
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
            transformOrigin: 'bottom left',
            transform: `translate(${pos.x}px, ${-pos.y}px)`,
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
            transformOrigin: 'bottom right',
            transform: `translate(${-pos.x}px, ${-pos.y}px)`,
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
            transformOrigin: 'top left',
            transform: `translate(${pos.x}px, ${pos.y}px)`,
          }}>
          {children}
        </div>
      )
    }
  }
}
