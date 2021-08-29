import * as React from 'react'
import { CSSProperties } from 'react'
import { stylesheet } from 'typestyle'

import theme from '../../theme'

interface Props {
  style: CSSProperties
}

const styles = stylesheet({
  SelectionBox: {
    border: `2px solid ${theme.colors.uiPrimaryLight}`,
    background: theme.colors.uiPrimaryVeryLight,
  },
})

export function SelectionBox(props: Props): JSX.Element {
  const { style } = props

  return <div className={styles.SelectionBox} style={style} />
}
