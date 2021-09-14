import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './TextActionMenu.styles'
import {
  HighlightColor,
  isBackgroundHighlight,
  isColorHighlight,
  styles as highlightStyles,
} from '../ProseMirrorSchema/highlight'

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
      className={classes(styles.Button, props.glow && styles.Glow)}
      onClick={props.onClick}>
      {props.children}
    </button>
  )
}

function TextButton(props: ButtonProps): JSX.Element {
  return (
    <button
      className={classes(styles.TextButton, props.glow && styles.Glow)}
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

interface LinkDialogProps {
  activeLink: string
  setLink: (link: string) => void
}

function LinkDialog(props: LinkDialogProps): JSX.Element {
  const [inputVal, setInputVal] = useState(props.activeLink)

  return (
    <div className={styles.LinkDialog}>
      <input
        value={inputVal}
        autoFocus={true}
        onChange={e => setInputVal(e.target.value)}
        placeholder="Paste an URL..."
      />
      <button onClick={() => props.setLink(inputVal)}>Set</button>
    </div>
  )
}

enum MenuFocus {
  Main = 'main',
  HighlighPicker = 'highlightPicker',
  LinkDialog = 'linkDialog',
}

interface TextActionMenuProps {
  boldActive: boolean
  italicActive: boolean
  strikeActive: boolean
  underlineActive: boolean
  codeActive: boolean
  activeHighlightColor: HighlightColor | undefined
  activeLink: string
  toggleBold: () => void
  toggleItalic: () => void
  toggleStrike: () => void
  toggleUnderline: () => void
  toggleCode: () => void
  turnIntoLatex: () => void
  setHighlight: (color: HighlightColor | undefined) => void
  setLink: (link: string) => void
}

/** An UI to trigger commands that operate on a selection. */
export const TextActionMenu = React.forwardRef<
  HTMLDivElement,
  TextActionMenuProps
>(function TextActionMenu(props, ref) {
  const { setHighlight, setLink } = props
  const [menuFocus, setMenuFocus] = useState<MenuFocus>(MenuFocus.Main)

  const toggleHighlightPicker = useCallback(() => {
    setMenuFocus(focus =>
      focus === MenuFocus.HighlighPicker
        ? MenuFocus.Main
        : MenuFocus.HighlighPicker
    )
  }, [])

  const toggleLinkDialog = useCallback(() => {
    setMenuFocus(focus =>
      focus === MenuFocus.LinkDialog ? MenuFocus.Main : MenuFocus.LinkDialog
    )
  }, [])

  /** Close all sub-menus when TextActionMenu unmounts. */
  useEffect(() => {
    return () => {
      setMenuFocus(MenuFocus.Main)
    }
  }, [])

  const handleSetHighlight = useCallback(
    (color: HighlightColor) => {
      setMenuFocus(MenuFocus.Main)
      setHighlight(color)
    },
    [setHighlight]
  )

  const handleSetLink = useCallback(
    (link: string) => {
      setMenuFocus(MenuFocus.Main)
      setLink(link)
    },
    [setLink]
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
      <Button onClick={toggleHighlightPicker}>
        <mark
          className={highlightStyles.Highlight}
          data-color={props.activeHighlightColor || null}>
          {highlight}
        </mark>
      </Button>
      <TextButton glow={!!props.activeLink} onClick={toggleLinkDialog}>
        Link
      </TextButton>
      <Button onClick={props.turnIntoLatex}>{math}</Button>
      {menuFocus === MenuFocus.HighlighPicker && (
        <HighlightPicker setHighlight={handleSetHighlight} />
      )}
      {menuFocus === MenuFocus.LinkDialog && (
        <LinkDialog activeLink={props.activeLink} setLink={handleSetLink} />
      )}
    </div>
  )
})
