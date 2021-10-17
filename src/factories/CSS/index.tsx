import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { classes, stylesheet } from 'typestyle'

import { emptyNavItem } from '../commonStyles'
import {
  ConceptDisplayProps,
  Factory,
  TypedConcept,
} from '../../core/interfaces'
import theme from '../../theme'

interface CSSContent {
  globalCss: string
}

type Props = ConceptDisplayProps<CSSContent>

const styles = stylesheet({
  cssBlock: {
    padding: theme.paddings.blockComfort,
  },
  cssNavItem: {
    ...emptyNavItem,
    color: theme.colors.contentText,
  },
  textarea: {
    /**
     * Prevent extra space under <textarea>.
     * @see https://stackoverflow.com/questions/7144843/extra-space-under-textarea-differs-along-browsers
     */
    display: 'block',
    color: theme.colors.contentText,
    background: 'inherit',
    outlineColor: theme.colors.contentText,
    fontFamily: theme.fonts.monospace,
    lineHeight: 1.4,
    width: '100%',
    height: 300,
    padding: '0.5rem',
    border: 'none',
    resize: 'none',
    cursor: 'inherit',
    $nest: {
      '&:focus-visible': {
        outline: 'none',
      },
    },
  },
  noScrollAndPadding: {
    padding: 0,
    overflow: 'hidden',
  },
})

function CSSEditable({
  readOnly,
  concept,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  const { globalCss } = concept.summary.data
  const styleElRef = useRef<HTMLStyleElement>()
  const cssTextElRef = useRef<Text>()
  const textareaElRef = useRef<HTMLTextAreaElement>()
  const [cssText, setCssText] = useState(globalCss)

  /** Control the lifecycle of <style>. */
  useEffect(() => {
    const styleEl = document.createElement('style')
    const cssTextEl = document.createTextNode('')
    styleEl.appendChild(cssTextEl)
    document.head.appendChild(styleEl)
    styleElRef.current = styleEl
    cssTextElRef.current = cssTextEl
    return () => {
      document.head.removeChild(styleEl)
    }
  }, [])

  /** Update CSS. */
  useEffect(() => {
    cssTextElRef.current.textContent = cssText
  }, [cssText])

  /** Prevent moving camera while scrolling. */
  useEffect(() => {
    const textareaEl = textareaElRef.current
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) e.stopPropagation()
    }
    textareaEl.addEventListener('wheel', handleWheel)
    return () => textareaEl.removeEventListener('wheel', handleWheel)
  }, [])

  /** Prevent selection and focus when moving. */
  useEffect(() => {
    const textareaEl = textareaElRef.current
    if (readOnly && textareaEl) {
      textareaEl.blur()
      window.getSelection().removeAllRanges()
    }
  }, [readOnly])

  return (
    <div className={styles.cssBlock}>
      <textarea
        ref={textareaElRef}
        value={cssText}
        className={styles.textarea}
        onFocus={onInteractionStart}
        onBlur={onInteractionEnd}
        onChange={e => {
          setCssText(e.target.value)
          onChange({ globalCss: e.target.value })
        }}
        readOnly={readOnly}
      />
    </div>
  )
}

function CSSReadOnly({ concept }: Props) {
  const { globalCss } = concept.summary.data
  return (
    <div className={styles.cssNavItem}>
      <textarea
        value={globalCss}
        className={classes(styles.textarea, styles.noScrollAndPadding)}
        readOnly
      />
    </div>
  )
}

function CSS(props: Props) {
  switch (props.viewMode) {
    case 'NavItem':
      return <CSSReadOnly {...props} />
    default:
      return <CSSEditable {...props} />
  }
}

export const CSSFactory: Factory = {
  id: 'css',
  name: 'CSS',
  component: React.memo(CSS),
  toText: (concept: TypedConcept<CSSContent>) => {
    return concept.summary.data.globalCss
  },
}
