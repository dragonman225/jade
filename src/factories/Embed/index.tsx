import * as React from 'react'
import { useRef, useState, useCallback, useContext } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.styles'
import { Iframe } from './Iframe'
import { useSyntheticFocus } from './useSyntheticFocus'
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
import { saveTextToClipboard } from '../../core/utils/clipboard'

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
  const { blocks } = useContext(AppStateContext)
  /** `blockId` is useless when embedded in other blocks. */
  const block = findBlock(blocks, blockId)
  const isResizing = block && block.mode === InteractionMode.Resizing
  const isFocusing = block && block.mode === InteractionMode.Focusing
  const { openExternal, dispatchAction } = useContext(SystemContext)
  const { data } = concept.summary
  const url = data && data.url ? data.url : ''
  const inputRef = useRef<HTMLInputElement>()
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
          <Iframe url={url} noInteraction={noInteraction} />
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
          ref={inputRef}
          className={styles.LinkInput}
          placeholder="Paste in https://..."
          type="url"
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
          onKeyDown={e => e.key === 'Enter' && embedLink()}
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

  const { blocks } = useContext(AppStateContext)
  const block = findBlock(blocks, blockId)

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
          <Iframe
            url={url}
            noInteraction={true}
            scale={viewMode === 'NavItem' ? 0.3 : 1}
          />
        </div>
      </div>
    )
  } else {
    return <div className={styles.emptyNavItem}>An empty embed</div>
  }
}

function Embed(props: Props) {
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
  component: React.memo(Embed),
  toText: (concept: TypedConcept<EmbedContent>) => {
    const url = concept.summary.data.url
    return `embed ${url || ''}`
  },
}
