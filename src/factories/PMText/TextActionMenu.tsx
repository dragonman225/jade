import * as React from 'react'
import { classes } from 'typestyle'

import { styles } from './TextActionMenu.styles'

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
    <span style={{ position: 'absolute', top: '.25rem', left: '.2rem' }}>
      T
    </span>
    <span style={{ position: 'absolute', bottom: '.25rem', left: '.5rem' }}>
      E
    </span>
    <span style={{ position: 'absolute', top: '.25rem', right: '.2rem' }}>
      X
    </span>
  </div>
)

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

interface TextActionMenuProps {
  boldActive: boolean
  italicActive: boolean
  strikeActive: boolean
  underlineActive: boolean
  codeActive: boolean
  toggleBold: () => void
  toggleItalic: () => void
  toggleStrike: () => void
  toggleUnderline: () => void
  toggleCode: () => void
  turnIntoMath: () => void
}

/** An UI to trigger commands that operate on a selection. */
export const TextActionMenu = React.forwardRef<
  HTMLDivElement,
  TextActionMenuProps
>(function TextActionMenu(props, ref) {
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
      <Button onClick={props.turnIntoMath}>{math}</Button>
    </div>
  )
})
