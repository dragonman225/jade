import * as React from 'react'
import { stylesheet } from 'typestyle'

import { Settings, TypedConcept, Vec2 } from '../../core/interfaces'
import theme from '../../theme'

interface Props {
  focus: Vec2
  scale: number
  selecting: boolean
  selectedCount: number
  viewingConcept: TypedConcept<unknown>
  settings: Settings
}

const styles = stylesheet({
  canvasMonitor: {
    $nest: {
      '& code': {
        color: theme.colors.neutral10,
        background: theme.colors.neutral90,
        fontSize: '.9em',
        padding: '.1rem .3rem',
        borderRadius: '.3rem',
        transitionProperty: 'color, background',
        transitionDuration: '0.2s',
        transitionTimingFunction: `${theme.easings.easeInOutCubic}`,
      },
      '& p': {
        marginTop: 0,
        marginBottom: '0.3em',
      },
      '& p:last-child': {
        marginBottom: 0,
      },
    },
  },
  glowCode: {
    $nest: {
      '& code': {
        color: theme.colors.uiText,
        background: theme.colors.uiPrimaryAttractive,
      },
    },
  },
})

export function CanvasMonitor({
  focus,
  scale,
  selecting,
  selectedCount,
  viewingConcept,
  settings,
}: Props): JSX.Element {
  return (
    <div className={styles.canvasMonitor}>
      <p>
        Focusing{' '}
        <code>
          ({focus.x.toFixed(1)}, {focus.y.toFixed(1)})
        </code>{' '}
        with scale <code>{(scale * 100).toFixed(1)}%</code>
      </p>
      <p className={selecting ? styles.glowCode : undefined}>
        <code>
          {selecting ? '✓' : '✗'} Selecting {selectedCount}
        </code>
      </p>
      <p>
        <code>viewingConcept.id</code>: <code>{viewingConcept.id}</code>
      </p>
      <p>
        <code>settings.viewingConceptId</code>:{' '}
        <code>{settings.viewingConceptId}</code>
      </p>
    </div>
  )
}
