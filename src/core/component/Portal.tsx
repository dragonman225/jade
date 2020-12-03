import * as React from 'react'
import { style, classes } from 'typestyle'

type Props =
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const Portal = React.forwardRef<HTMLDivElement, Props>(
  function Portal(props, ref) {
    const { children, className, ...other } = props
    const boxClassName = style({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    })
    return <div
      className={classes(boxClassName, className)}
      ref={ref} {...other}>{children}</div>
  }
)