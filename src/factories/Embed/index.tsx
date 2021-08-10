import * as React from 'react'
import { useRef } from 'react'

import { styles } from './index.styles'
import {
  ConceptDisplayProps,
  Factory,
  InitializedConceptData,
} from '../../core/interfaces'

interface Data extends InitializedConceptData {
  url?: string
}

type Props = ConceptDisplayProps<Data>

export const Embed: React.FunctionComponent<Props> = props => {
  const { onChange, onInteractionStart, onInteractionEnd } = props
  const data = props.concept.summary.data as Data
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
          <button style={{ cursor: 'move' }}>Move</button>
          <button
            onClick={() => onChange({ initialized: true, url: undefined })}>
            Replace
          </button>
        </div>
      </div>
    )
  } else {
    return (
      <>
        <input
          ref={inputRef}
          placeholder="Paste in https://…"
          type="url"
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
        />
        <button
          onClick={() => {
            onChange({ initialized: true, url: inputRef.current.value })
          }}>
          Embed link
        </button>
      </>
    )
  }
}

export const EmbedFactory: Factory = {
  id: 'embed',
  name: 'Embed',
  component: Embed,
}
