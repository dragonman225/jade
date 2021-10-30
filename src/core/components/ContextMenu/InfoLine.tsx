import * as React from 'react'
import { stylesheet } from 'typestyle'

import theme from '../../../theme'

interface InfoLineProps {
  label: string
  value: string
}

const styles = stylesheet({
  InfoLine: {
    $nest: {
      '&, & > *': {
        userSelect: 'text',
      },
    },
  },
  Label: {
    color: theme.colors.uiGrey,
  },
  Value: {
    color: theme.colors.contentText,
  },
})

export function InfoLine({ label, value }: InfoLineProps): JSX.Element {
  return (
    <div className={styles.InfoLine}>
      <span className={styles.Label}>{label}</span>&nbsp;
      <span className={styles.Value}>{value}</span>
    </div>
  )
}
