import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

const styles = stylesheet({
  /**
   * We want children to be able to specify `right` and `bottom`, so we
   * need to occupy the whole sreen.
   */
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    /**
     * Since it's occupying the whole screen and it need to be at the top
     * of all other elements, so it blocks all events from other elements
     * if we don't disable its event detection.
     */
    pointerEvents: 'none',
  },
  overlayChildren: {
    width: 0,
    height: 0,
    /**
     * But we want to get events from elements in the Overlay, e.g. menu
     * clicks.
     */
    pointerEvents: 'auto',
  },
})

export const Overlay = React.forwardRef<HTMLDivElement, Props>(function Overlay(
  props,
  ref
) {
  const { children, className, ...other } = props
  return (
    <div className={classes(styles.overlay, className)} {...other}>
      <div className={styles.overlayChildren} ref={ref}>
        {children}
      </div>
    </div>
  )
})
