import * as React from 'react'
import { useRef } from 'react'

import { styles } from './index.styles'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'

interface EmbedContent {
  initialized?: boolean
  url?: string
}

type Props = ConceptDisplayProps<EmbedContent>

export const Embed: React.FunctionComponent<Props> = props => {
  const { onChange, onInteractionStart, onInteractionEnd } = props
  const data = props.concept.summary.data
  const url = data && data.url ? data.url : ''

  const inputRef = useRef<HTMLInputElement>()

  if (url) {
    return (
      <div style={{ position: 'relative' }}>
        <div className={styles.FrameWrapper}>
          <iframe
            width="100%"
            height="100%"
            src={url}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}>
          <button className={styles.Button} style={{ cursor: 'move' }}>
            Move
          </button>
          <button
            className={styles.Button}
            onClick={() => onChange({ initialized: true, url: undefined })}>
            Replace
          </button>
        </div>
      </div>
    )
  } else {
    return (
      <div className={styles.EmbedBlock}>
        <input
          ref={inputRef}
          className={styles.Input}
          placeholder="Paste in https://..."
          type="url"
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
        />
        <button
          className={styles.Button}
          onClick={() => {
            onChange({ initialized: true, url: inputRef.current.value })
          }}>
          Embed link
        </button>
      </div>
    )
  }
}

export const EmbedFactory: Factory = {
  id: 'embed',
  name: 'Embed',
  component: Embed,
}
