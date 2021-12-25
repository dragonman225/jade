import * as React from 'react'
import { classes, stylesheet } from 'typestyle'

import { getEmbedUrl } from './utils'

interface IframeProps {
  url: string
  noInteraction: boolean
  scale?: number
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

const IframeWithoutMemo = React.forwardRef<HTMLIFrameElement, IframeProps>(
  function Iframe({ url, noInteraction, scale = 1 }, ref) {
    const sizePercent = `${100 / scale}%`
    return (
      <iframe
        ref={ref}
        className={classes(
          styles.iframe,
          noInteraction && styles.noInteraction
        )}
        style={{
          width: sizePercent,
          height: sizePercent,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        width={sizePercent}
        height={sizePercent}
        src={getEmbedUrl(url)}
        frameBorder="0"
        loading="lazy"
        scrolling={noInteraction ? 'no' : 'auto'}
        allow="clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }
)

export const Iframe = React.memo(IframeWithoutMemo)
