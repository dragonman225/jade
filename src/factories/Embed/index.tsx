import * as React from 'react'
import { useRef, useState, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.styles'
import { getEmbedUrl } from './utils'
import {
  ConceptDisplayProps,
  Factory,
  TypedConcept,
} from '../../core/interfaces'

interface EmbedContent {
  initialized?: boolean
  url?: string
}

type Props = ConceptDisplayProps<EmbedContent>

export const Embed: React.FunctionComponent<Props> = props => {
  const { viewMode, onChange, onInteractionStart, onInteractionEnd } = props
  const data = props.concept.summary.data
  const url = data && data.url ? data.url : ''
  const inputRef = useRef<HTMLInputElement>()
  const [blockFrameInteraction, setBlockFrameInteraction] = useState(false)

  const endMoving = useCallback(() => {
    window.removeEventListener('mouseup', endMoving)
    window.removeEventListener('touchend', endMoving)
    setBlockFrameInteraction(false)
  }, [])

  const startMoving = useCallback(() => {
    setBlockFrameInteraction(true)
    window.addEventListener('mouseup', endMoving)
    window.addEventListener('touchend', endMoving)
  }, [endMoving])

  switch (viewMode) {
    case 'Block':
    case 'CardTitle': {
      if (url) {
        return (
          <div className={styles.EmbedBlockDisplay}>
            <div className={styles.FrameWrapper}>
              <iframe
                className={classes(
                  styles.Frame,
                  blockFrameInteraction && styles.NoInteraction
                )}
                width="100%"
                height="100%"
                src={getEmbedUrl(url)}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className={styles.ControlButtonGroup}>
              <button
                className={styles.ControlButton}
                style={{ cursor: 'move' }}
                onMouseDown={startMoving}
                onTouchStart={startMoving}>
                Move
              </button>
              <button
                className={styles.ControlButton}
                onClick={() => onChange({ initialized: true, url: undefined })}>
                Replace
              </button>
            </div>
          </div>
        )
      } else {
        return (
          <div className={styles.EmbedBlockEmpty}>
            <input
              ref={inputRef}
              className={styles.LinkInput}
              placeholder="Paste in https://..."
              type="url"
              onFocus={onInteractionStart}
              onBlur={onInteractionEnd}
            />
            <button
              className={styles.LinkConfirmButton}
              onClick={() => {
                onChange({ initialized: true, url: inputRef.current.value })
              }}>
              Embed link
            </button>
          </div>
        )
      }
    }
    case 'NavItem': {
      if (url) {
        return (
          <div className={styles.EmbedBlockDisplay}>
            <div className={styles.FrameWrapper}>
              <iframe
                className={classes(styles.Frame, styles.NoInteraction)}
                width="100%"
                height="100%"
                src={getEmbedUrl(url)}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )
      } else {
        return <div>An empty embed</div>
      }
    }
  }
}

export const EmbedFactory: Factory = {
  id: 'embed',
  name: 'Embed',
  component: Embed,
  toText: (concept: TypedConcept<EmbedContent>) => {
    const url = concept.summary.data.url
    return `embed ${url || ''}`
  },
}
