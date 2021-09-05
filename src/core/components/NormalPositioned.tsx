import * as React from 'react'

import { SelectionBox } from './SelectionBox'
import { Box, Vec2 } from '../interfaces'

interface Props {
  focus: Vec2
  scale: number
  selecting: boolean
  selectionBox: Box
  children?: React.ReactNode
}

export function NormalPositioned(props: Props): JSX.Element {
  const { focus, scale, selecting, selectionBox, children } = props

  return (
    <div
      /** Act as the origin of the layer. */
      style={{
        width: 0,
        height: 0,
        transformOrigin: 'top left',
        transform: `translate3d(${-focus.x * scale}px, ${
          -focus.y * scale
        }px, 0px) scale(${scale})`,
        // TODO: Use `use-spring` to make proper animations.
        // transition: 'transform 50ms ease-in-out 0s',
      }}>
      {children}
      {selecting && (
        <SelectionBox
          key="SelectionBox"
          style={{
            width: selectionBox.w,
            height: selectionBox.h,
            position: 'absolute',
            transformOrigin: 'top left',
            transform: `translate3d(${selectionBox.x}px, ${selectionBox.y}px, 0px)`,
          }}
        />
      )}
    </div>
  )
}
