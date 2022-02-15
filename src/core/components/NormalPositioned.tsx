import * as React from 'react'
import { stylesheet } from 'typestyle'
import { useSpring, animated } from '@react-spring/web'

import { SelectionBox } from './SelectionBox'
import { Box, Vec2 } from '../interfaces'

interface Props {
  focus: Vec2
  scale: number
  selecting: boolean
  selectionBox: Box
  shouldAnimate?: boolean
  children?: React.ReactNode
}

const styles = stylesheet({
  origin: {
    width: 0,
    height: 0,
    transformOrigin: 'top left',
    position: 'absolute',
    top: 0,
    left: 0,
  },
})

export function NormalPositioned(props: Props): JSX.Element {
  const { focus, scale, selecting, selectionBox, shouldAnimate, children } =
    props
  const transform = `\
translate3d(${-focus.x * scale}px, ${-focus.y * scale}px, 0px) scale(${scale})`
  const animatedStyles = useSpring({
    transform,
    config: {
      frequency: 0.3,
      damping: 1,
    },
  })

  return (
    <animated.div
      /** Act as the environment origin for all normal positioned blocks. */
      className={styles.origin}
      style={{
        transform: shouldAnimate ? animatedStyles.transform : transform,
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
            zIndex: 99999999,
          }}
        />
      )}
    </animated.div>
  )
}
