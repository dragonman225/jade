import * as React from 'react'
import { keyframes, stylesheet } from 'typestyle'
import theme from '../../theme'

const breathe = keyframes({
  '0%, 100%': {
    opacity: 0.8,
  },
  '50%': {
    opacity: 0.4,
  },
})

const styles = stylesheet({
  conceptLoader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    $nest: {
      '& > div': {
        width: '0.3rem',
        height: '0.3rem',
        margin: '0.125rem',
        borderRadius: '50%',
        background: theme.colors.neutral60,
        animation: `${breathe} 1.2s ${theme.easings.easeOutExpo} infinite`,
      },
      '& > div:nth-child(1)': {
        animationDelay: '0s',
      },
      '& > div:nth-child(2)': {
        animationDelay: '-0.4s',
      },
      '& > div:nth-child(3)': {
        animationDelay: '-0.8s',
      },
    },
  },
})

export const ConceptLoader = React.memo(function ConceptLoader() {
  return (
    <div className={styles.conceptLoader}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
})
