import * as React from 'react'
import { stylesheet } from 'typestyle'
import theme from '../../theme'

interface Props {
  value: number
}

const styles = stylesheet({
  blockCounter: {
    display: 'flex',
    alignItems: 'flex-end',
    margin: 0,
    lineHeight: 1,
  },
  count: {
    fontSize: '1.6rem',
    color: theme.colors.uiPrimary,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '0.5rem',
  },
  firstLine: {
    fontSize: '0.9rem',
  },
  secondLine: {
    fontSize: '0.7rem',
  },
})

export function BlockCounter({ value }: Props): JSX.Element {
  return (
    <div className={styles.blockCounter}>
      <div className={styles.count}>{value}</div>
      <div className={styles.text}>
        <div>block{value > 1 ? 's' : ''}</div>
        <div className={styles.secondLine}>on this canvas</div>
      </div>
    </div>
  )
}
