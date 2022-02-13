import * as React from 'react'
import { useState } from 'react'
import { stylesheet } from 'typestyle'

import { Box } from '../interfaces'
import { boxFloor, getBoxToBoxArrowObjectVer, vecFloor } from '../utils'
import theme from '../../theme'

interface Props {
  fromBox: Box
  toBox: Box
  viewBox: Box
  /** A CSS color. */
  color?: string
  /** A number used to infer balanced line thickness and arrow head size. */
  size?: number
  onMouseDown?: React.MouseEventHandler<SVGSVGElement>
}

const styles = stylesheet({
  Arrow: {
    pointerEvents: 'none',
    overflow: 'visible',
  },
})

export function Arrow({
  fromBox,
  toBox,
  viewBox,
  color = '#000',
  size = 7,
  onMouseDown,
}: Props): JSX.Element {
  const [sx, sy, c1x, c1y, c2x, c2y, ex, ey, ae] = getBoxToBoxArrowObjectVer(
    fromBox,
    toBox,
    { padEnd: size }
  )
  const [start, end, c1, c2, arrowAngle] = [
    vecFloor({ x: sx, y: sy }, 2),
    vecFloor({ x: ex, y: ey }, 2),
    vecFloor({ x: c1x, y: c1y }, 2),
    vecFloor({ x: c2x, y: c2y }, 2),
    ae,
  ]
  const viewBoxFloored = boxFloor(viewBox, 2)

  /**
   * When the pointer goes into the action area (a thicker transparent
   * path independent of the visible path), `isHovering` is set to true and
   * the arrow is highlighted to hint the user.
   */
  const [isHovering, setIsHovering] = useState(false)
  const preventContextMenu: React.MouseEventHandler<SVGSVGElement> = e =>
    e.preventDefault()

  return (
    <svg
      className={styles.Arrow}
      width={viewBoxFloored.w}
      height={viewBoxFloored.h}
      xmlns="http://www.w3.org/2000/svg"
      onMouseDown={onMouseDown}
      onContextMenu={preventContextMenu}>
      <path
        d={`M ${start.x - viewBoxFloored.x} ${start.y - viewBoxFloored.y} C ${
          c1.x - viewBoxFloored.x
        } ${c1.y - viewBoxFloored.y}, ${c2.x - viewBoxFloored.x} ${
          c2.y - viewBoxFloored.y
        }, ${end.x - viewBoxFloored.x} ${end.y - viewBoxFloored.y}`}
        stroke={isHovering ? theme.colors.uiPrimary : color}
        strokeWidth={size / 2}
        fill="none"
      />
      <polygon
        points={`0,${-size} ${size * 2},0, 0,${size}`}
        transform={`translate(${end.x - viewBoxFloored.x}, ${
          end.y - viewBoxFloored.y
        }) rotate(${arrowAngle})`}
        fill={isHovering ? theme.colors.uiPrimary : color}
      />
      <path
        d={`M ${start.x - viewBoxFloored.x} ${start.y - viewBoxFloored.y} C ${
          c1.x - viewBoxFloored.x
        } ${c1.y - viewBoxFloored.y}, ${c2.x - viewBoxFloored.x} ${
          c2.y - viewBoxFloored.y
        }, ${end.x - viewBoxFloored.x} ${end.y - viewBoxFloored.y}`}
        stroke="transparent"
        strokeWidth={size * 2}
        fill="none"
        pointerEvents="visibleStroke"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
    </svg>
  )
}
