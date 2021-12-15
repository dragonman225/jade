import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

import { TweetEmbed, TwitterEmbedProps } from './TweetEmbed'

const styles = stylesheet({
  container: {
    height: '100%',
  },
  overflowAuto: {
    overflow: 'auto',
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  disableIframeInteraction: {
    $nest: {
      '& iframe': {
        pointerEvents: 'none',
      },
    },
  },
})

/** A Jade-specific Tweet component. */
export function Tweet(
  props: TwitterEmbedProps & { noInteraction: boolean }
): JSX.Element {
  return (
    <div
      className={classes(
        styles.container,
        props.noInteraction ? styles.overflowHidden : styles.overflowAuto
      )}>
      <TweetEmbed
        {...props}
        className={classes(
          props.noInteraction && styles.disableIframeInteraction,
          props.className
        )}
      />
    </div>
  )
}
