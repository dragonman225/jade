import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

const styles = stylesheet({
  Overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})

export const Overlay = React.forwardRef<HTMLDivElement, Props>(function Overlay(
  props,
  ref
) {
  const { children, className, ...other } = props
  return (
    <div className={classes(styles.Overlay, className)} ref={ref} {...other}>
      {children}
    </div>
  )
})
