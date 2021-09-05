import * as React from 'react'
import { stylesheet } from 'typestyle'

import { boxFloor, getArrow, vecFloor } from '../utils/math'
import { Box } from '../interfaces'

interface Props {
  fromBox: Box
  toBox: Box
  viewBox: Box
  /** A CSS color. */
  color?: string
  /** A number used to infer balanced line thickness and arrow head size. */
  size?: number
}

const styles = stylesheet({
  Arrow: {
    pointerEvents: 'none',
  },
})

export function Arrow({
  fromBox,
  toBox,
  viewBox,
  color = '#000',
  size = 7,
}: Props): JSX.Element {
  const [_start, _end, _c1, _c2, arrowAngle] = getArrow(fromBox, toBox, size)
  const [start, end, c1, c2] = [
    vecFloor(_start, 2),
    vecFloor(_end, 2),
    vecFloor(_c1, 2),
    vecFloor(_c2, 2),
  ]
  const viewBoxFloored = boxFloor(viewBox, 2)

  return (
    <svg
      className={styles.Arrow}
      width={viewBoxFloored.w}
      height={viewBoxFloored.h}
      xmlns="http://www.w3.org/2000/svg">
      <path
        d={`M ${start.x - viewBoxFloored.x} ${start.y - viewBoxFloored.y} C ${
          c1.x - viewBoxFloored.x
        } ${c1.y - viewBoxFloored.y}, ${c2.x - viewBoxFloored.x} ${
          c2.y - viewBoxFloored.y
        }, ${end.x - viewBoxFloored.x} ${end.y - viewBoxFloored.y}`}
        stroke={color}
        strokeWidth={size / 1.618}
        fill="transparent"
        onClick={e => console.log(e)}
      />
      <polygon
        points={`0,${-size} ${size * 2},0, 0,${size}`}
        transform={`translate(${end.x - viewBoxFloored.x}, ${
          end.y - viewBoxFloored.y
        }) rotate(${arrowAngle})`}
        fill={color}
      />
    </svg>
  )
}
