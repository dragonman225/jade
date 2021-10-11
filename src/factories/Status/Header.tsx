import icon from '../../../assets/icon.png'
import * as React from 'react'
import { stylesheet } from 'typestyle'

import env from '../../env'

const styles = stylesheet({
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    $nest: {
      '& > *': {
        margin: 0,
      },
      '& > h3': {
        marginLeft: '0.5rem',
        marginBottom: '0.4rem',
        opacity: 0.6,
      },
    },
  },
  appName: {
    display: 'flex',
    alignItems: 'center',
    $nest: { '& > img': { height: '1.3em', marginRight: '0.3rem' } },
  },
})

export function Header(): JSX.Element {
  return (
    <header className={styles.header}>
      <h1 className={styles.appName}>
        <img src={icon} />
        Jade
      </h1>
      <h3>v{env.JADE_VER}</h3>
    </header>
  )
}
