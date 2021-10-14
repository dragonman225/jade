import * as React from 'react'
import { useRef, useState, useCallback, useContext } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.styles'
import { getEmbedUrl } from './utils'
import {
  ConceptDisplayProps,
  Factory,
  InteractionMode,
  TypedConcept,
} from '../../core/interfaces'
import { Action } from '../../core/store/actions'
import { SystemContext } from '../../core/store/systemContext'
import { AppStateContext } from '../../core/store/appStateContext'
import { findBlock } from '../../core/utils/block'

interface EmbedContent {
  initialized?: boolean
  url?: string
}

type Props = ConceptDisplayProps<EmbedContent>

export const Embed: React.FunctionComponent<Props> = props => {
  const {
    viewMode,
    blockId,
    onChange,
    onInteractionStart,
    onInteractionEnd,
  } = props
  /** Depending on blocks degrades perf. */
  const { blocks } = useContext(AppStateContext)
  /** `blockId` is useless when embedded in other blocks. */
  const block = findBlock(blocks, blockId)
  const isResizing = block && block.mode === InteractionMode.Resizing
  const { openExternal, dispatchAction } = useContext(SystemContext)
  const data = props.concept.summary.data
  const url = data && data.url ? data.url : ''
  const inputRef = useRef<HTMLInputElement>()
  const [allowFrameInteraction, setAllowFrameInteraction] = useState(true)

  const endMoving = useCallback(() => {
    window.removeEventListener('mouseup', endMoving)
    window.removeEventListener('touchend', endMoving)
    setAllowFrameInteraction(true)
  }, [])

  const startMoving = useCallback(() => {
    setAllowFrameInteraction(false)
    window.addEventListener('mouseup', endMoving)
    window.addEventListener('touchend', endMoving)
  }, [endMoving])

  switch (viewMode) {
    case 'Block':
    case 'CardTitle': {
      if (url) {
        return (
          <div
            className={classes(
              styles.EmbedBlockDisplay,
              block.size.h !== 'auto' && styles.fillParentHeight
            )}>
            <div
              className={
                block.size.h === 'auto'
                  ? styles.FrameWrapperAutoHeight
                  : styles.FrameWrapperFixedHeight
              }>
              <iframe
                className={classes(
                  styles.Frame,
                  (!allowFrameInteraction || isResizing) && styles.NoInteraction
                )}
                width="100%"
                height="100%"
                src={getEmbedUrl(url)}
                frameBorder="0"
                loading="lazy"
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
                onClick={() => {
                  onChange({ initialized: true, url: undefined })
                  dispatchAction({
                    type: Action.BlockSetSize,
                    data: {
                      id: blockId,
                      size: {
                        w: 300,
                        h: 'auto',
                      },
                    },
                  })
                }}>
                Replace
              </button>
              <button
                className={styles.ControlButton}
                onClick={() => openExternal(url)}>
                Original
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
                dispatchAction({
                  type: Action.BlockSetSize,
                  data: {
                    id: blockId,
                    size: {
                      w: 400,
                      h: 225,
                    },
                  },
                })
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
          <div
            className={classes(
              styles.EmbedBlockDisplay,
              block.size.h !== 'auto' && styles.fillParentHeight
            )}>
            <div
              className={
                block.size.h === 'auto'
                  ? styles.FrameWrapperAutoHeight
                  : styles.FrameWrapperFixedHeight
              }>
              <iframe
                className={classes(styles.Frame, styles.NoInteraction)}
                width="100%"
                height="100%"
                src={getEmbedUrl(url)}
                frameBorder="0"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )
      } else {
        return <div className={styles.emptyNavItem}>An empty embed</div>
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
