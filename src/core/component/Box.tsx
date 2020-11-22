import * as React from 'react'
import * as typestyle from 'typestyle'

type Props =
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const Box = React.forwardRef<HTMLDivElement, Props>(
  function Box(props, ref) {
    const { children, className, ...other } = props
    const boxClassName = typestyle.style({
      background: '#fff',
      borderRadius: '.5rem',
      boxShadow: `
        rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px,
        rgba(15, 15, 15, 0.2) 0px 9px 24px`
    })
    return <div
      className={typestyle.classes(boxClassName, className)}
      ref={ref} {...other}>{children}</div>
  }
)