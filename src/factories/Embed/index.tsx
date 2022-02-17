import * as React from 'react'
import { useRef, useState, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.styles'
import { Iframe } from './Iframe'
import { Tweet } from './Tweet'
import {
  BlockInstance,
  ConceptDisplayProps,
  Factory,
  InteractionMode,
  TypedConcept,
} from '../../core/interfaces'
import { Action } from '../../core/store/actions'
import { useSystem } from '../../core/store/systemContext'
import { useAppState } from '../../core/store/appStateContext'
import { findBlock } from '../../core/utils/block'
import { saveTextToClipboard } from '../../core/utils/clipboard'
import { useSyntheticFocus } from '../../core/utils/useSyntheticFocus'
import { getTweetId, isTweetUrl } from './utils'

interface EmbedContent {
  initialized?: boolean
  url?: string
}

type Props = ConceptDisplayProps<EmbedContent>

// TODO: Separate two states.
function EmbedInteractive({
  blockId,
  concept,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  /** Depending on blocks degrades perf. */
  const { blocks } = useAppState()
  /** `blockId` is useless when embedded in other blocks. */
  const block = findBlock(blocks, blockId) as BlockInstance
  const isResizing = block && block.mode === InteractionMode.Resizing
  const isFocusing = block && block.mode === InteractionMode.Focusing
  const { openExternal, dispatchAction } = useSystem()
  const { data } = concept.summary
  const url = data && data.url ? data.url : ''
  const rInput = useRef<HTMLInputElement>(null)
  const [allowFrameInteraction, setAllowFrameInteraction] = useState(true)
  const noInteraction = !allowFrameInteraction || isResizing || !isFocusing
  const { setNodeRef } = useSyntheticFocus({
    onFocus: onInteractionStart,
    onBlur: onInteractionEnd,
  })

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

  const replaceLink = useCallback(() => {
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
  }, [blockId, onChange, dispatchAction])

  const embedLink = useCallback(() => {
    const url = rInput.current?.value
    if (!url) return
    onChange({ initialized: true, url })
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
  }, [blockId, onChange, dispatchAction])

  if (url) {
    return (
      <div
        className={classes(
          styles.EmbedBlockDisplay,
          block.size.h !== 'auto' && styles.fillParentHeight
        )}>
        <div
          ref={setNodeRef}
          className={
            block.size.h === 'auto'
              ? styles.FrameWrapperAutoHeight
              : styles.FrameWrapperFixedHeight
          }>
          {isTweetUrl(url) ? (
            <Tweet id={getTweetId(url)} noInteraction={noInteraction} />
          ) : (
            <Iframe url={url} noInteraction={noInteraction} />
          )}
        </div>
        {!isFocusing && (
          <div className={styles.ControlButtonGroup}>
            <button
              className={styles.ControlButton}
              style={{ cursor: 'move' }}
              onMouseDown={startMoving}
              onTouchStart={startMoving}>
              Move
            </button>
            <button className={styles.ControlButton} onClick={replaceLink}>
              Replace
            </button>
            <button
              className={styles.ControlButton}
              onClick={() => openExternal(url)}>
              Original
            </button>
            <button
              className={styles.ControlButton}
              onClick={() => saveTextToClipboard(url)}>
              Copy link
            </button>
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div className={styles.EmbedBlockEmpty}>
        <input
          ref={rInput}
          className={styles.LinkInput}
          placeholder="Paste in https://..."
          type="url"
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onInteractionEnd()
              embedLink()
            }
          }}
        />
        <button className={styles.LinkConfirmButton} onClick={embedLink}>
          Embed link
        </button>
      </div>
    )
  }
}

function EmbedReadOnly({ concept, blockId, viewMode }: Props) {
  const { data } = concept.summary
  const url = data && data.url ? data.url : ''

  const { blocks } = useAppState()
  const block = findBlock(blocks, blockId) as BlockInstance

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
          {isTweetUrl(url) ? (
            <Tweet id={getTweetId(url)} noInteraction={true} />
          ) : (
            <Iframe
              url={url}
              noInteraction={true}
              scale={viewMode === 'NavItem' ? 0.3 : 1}
            />
          )}
        </div>
      </div>
    )
  } else {
    return <div className={styles.emptyNavItem}>An empty embed</div>
  }
}

function Embed(props: Props): JSX.Element {
  switch (props.viewMode) {
    case 'NavItem':
      return <EmbedReadOnly {...props} />
    default:
      return <EmbedInteractive {...props} />
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
