import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './TextActionMenu.styles'
import {
  HighlightColor,
  isBackgroundHighlight,
  isColorHighlight,
  styles as highlightStyles,
} from './marks/highlight'

const bold = <span style={{ fontWeight: 600 }}>B</span>
const italic = <span style={{ fontStyle: 'italic' }}>I</span>
const strike = <s>S</s>
const underline = <span style={{ textDecoration: 'underline' }}>U</span>
const code = <span style={{ fontSize: '.8rem' }}>{'</>'}</span>
const math = (
  <div
    style={{
      fontFamily: 'serif',
      fontSize: '.7rem',
      position: 'relative',
      width: '100%',
      height: '100%',
    }}>
    <span style={{ position: 'absolute', top: '.35rem', left: '.3rem' }}>
      T
    </span>
    <span style={{ position: 'absolute', bottom: '.35rem', left: '.6rem' }}>
      E
    </span>
    <span style={{ position: 'absolute', top: '.35rem', right: '.3rem' }}>
      X
    </span>
  </div>
)
const highlight = <span style={{ padding: '0 .3rem' }}>A</span>

interface ButtonProps {
  glow?: boolean
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}

function Button(props: ButtonProps): JSX.Element {
  return (
    <button
      className={classes(styles.Button, props.glow && styles.ButtonSelected)}
      onClick={props.onClick}>
      {props.children}
    </button>
  )
}

interface HighlightPickerProps {
  setHighlight: (color: HighlightColor | undefined) => void
}

function HighlightPicker(props: HighlightPickerProps): JSX.Element {
  return (
    <div className={styles.HighlightPicker}>
      <div>
        <div className={styles.Label}>COLOR</div>
        <div>
          {Object.values(HighlightColor)
            .filter(isColorHighlight)
            .map(color => (
              <Button key={color} onClick={() => props.setHighlight(color)}>
                <mark className={highlightStyles.Highlight} data-color={color}>
                  {highlight}
                </mark>
              </Button>
            ))
            .concat(
              <Button
                key={'no-color'}
                onClick={() => props.setHighlight(undefined)}>
                <mark className={highlightStyles.Highlight}>{highlight}</mark>
              </Button>
            )}
        </div>
      </div>
      <div>
        <div className={styles.Label}>BACKGROUND</div>
        <div>
          {Object.values(HighlightColor)
            .filter(isBackgroundHighlight)
            .map(color => (
              <Button key={color} onClick={() => props.setHighlight(color)}>
                <mark className={highlightStyles.Highlight} data-color={color}>
                  {highlight}
                </mark>
              </Button>
            ))
            .concat(
              <Button
                key={'no-color'}
                onClick={() => props.setHighlight(undefined)}>
                <mark className={highlightStyles.Highlight}>{highlight}</mark>
              </Button>
            )}
        </div>
      </div>
    </div>
  )
}

interface TextActionMenuProps {
  boldActive: boolean
  italicActive: boolean
  strikeActive: boolean
  underlineActive: boolean
  codeActive: boolean
  activeHighlightColor: HighlightColor | undefined
  toggleBold: () => void
  toggleItalic: () => void
  toggleStrike: () => void
  toggleUnderline: () => void
  toggleCode: () => void
  turnIntoMath: () => void
  setHighlight: (color: HighlightColor | undefined) => void
}

/** An UI to trigger commands that operate on a selection. */
export const TextActionMenu = React.forwardRef<
  HTMLDivElement,
  TextActionMenuProps
>(function TextActionMenu(props, ref) {
  const { setHighlight } = props

  const [showHighlightPicker, setShowHighlightPicker] = useState(false)

  /** Close highlight picker when TextActionMenu unmounts. */
  useEffect(() => {
    return () => {
      setShowHighlightPicker(false)
    }
  }, [])

  const handleSetHighlight = useCallback(
    (color: HighlightColor) => {
      setHighlight(color)
      setShowHighlightPicker(false)
    },
    [setHighlight]
  )

  return (
    <div className={styles.TextActionMenu} ref={ref}>
      <Button glow={props.boldActive} onClick={props.toggleBold}>
        {bold}
      </Button>
      <Button glow={props.italicActive} onClick={props.toggleItalic}>
        {italic}
      </Button>
      <Button glow={props.strikeActive} onClick={props.toggleStrike}>
        {strike}
      </Button>
      <Button glow={props.underlineActive} onClick={props.toggleUnderline}>
        {underline}
      </Button>
      <Button glow={props.codeActive} onClick={props.toggleCode}>
        {code}
      </Button>
      <Button onClick={() => setShowHighlightPicker(true)}>
        <mark
          className={highlightStyles.Highlight}
          data-color={props.activeHighlightColor || null}>
          {highlight}
        </mark>
      </Button>
      <Button onClick={props.turnIntoMath}>{math}</Button>
      {showHighlightPicker && (
        <HighlightPicker setHighlight={handleSetHighlight} />
      )}
    </div>
  )
})
