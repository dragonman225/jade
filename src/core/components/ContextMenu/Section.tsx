import * as React from 'react'
import { stylesheet } from 'typestyle'

interface Props {
  children?: React.ReactNode
}

const styles = stylesheet({
  section: {
    $nest: {
      '&:not(:first-of-type)': {
        marginTop: '0.3rem',
      },
    },
  },
})

export function Section({ children }: Props): JSX.Element {
  return <div className={styles.section}>{children}</div>
}
