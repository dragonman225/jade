import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

type Props =
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

const styles = stylesheet({
  Portal: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

export const Portal = React.forwardRef<HTMLDivElement, Props>(
  function Portal(props, ref) {
    const { children, className, ...other } = props
    return <div
      className={classes(styles.Portal, className)}
      ref={ref} {...other}>{children}</div>
  }
)