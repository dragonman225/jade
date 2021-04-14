import * as React from 'react'
import { stylesheet, classes } from 'typestyle'

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

const styles = stylesheet({
  Box: {
    background: '#fff',
    borderRadius: 'var(--border-radius-large)',
    boxShadow: `
      rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
      rgba(15, 15, 15, 0.075) 0px 2px 6px,
      rgba(15, 15, 15, 0.1) 0px 6px 24px`,
  },
})

export const Box = React.forwardRef<HTMLDivElement, Props>(function Box(
  props,
  ref
) {
  const { children, className, ...other } = props
  return (
    <div className={classes(styles.Box, className)} ref={ref} {...other}>
      {children}
    </div>
  )
})
