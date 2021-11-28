import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

import { getEmbedUrl } from './utils'

interface IframeProps {
  url: string
  noInteraction: boolean
}

const styles = stylesheet({
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  noInteraction: {
    pointerEvents: 'none',
  },
})

export const Iframe = React.memo(
  React.forwardRef<HTMLIFrameElement, IframeProps>(
    ({ url, noInteraction }, ref) => (
      <iframe
        ref={ref}
        className={classes(
          styles.iframe,
          noInteraction && styles.noInteraction
        )}
        width="100%"
        height="100%"
        src={getEmbedUrl(url)}
        frameBorder="0"
        loading="lazy"
        scrolling={noInteraction ? 'no' : 'auto'}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  )
)
