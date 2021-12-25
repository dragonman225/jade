import icon from '../../../assets/icon.png'
import * as React from 'react'
import { stylesheet } from 'typestyle'

import env from '../../env'

const styles = stylesheet({
  header: {
    $nest: {
      '& > *': {
        margin: 0,
      },
      '& > h1, & > h3': {
        fontWeight: 500,
      },
    },
  },
  appName: {
    display: 'flex',
    alignItems: 'center',
    $nest: {
      '& > img': { height: '1.3em', marginRight: '0.5rem' },
      '& > span': { transform: 'translateY(-0.2rem)' },
    },
  },
  buildInfo: {
    opacity: 0.7,
    fontSize: '1rem',
    paddingLeft: '0.25rem',
  },
})

export function Header(): JSX.Element {
  return (
    <header className={styles.header}>
      <h1 className={styles.appName}>
        <img src={icon} />
        <span>Jade</span>
      </h1>
      <h3 className={styles.buildInfo}>
        v{env.JADE_VER} ({env.JADE_LAST_UPDATED})
      </h3>
    </header>
  )
}
