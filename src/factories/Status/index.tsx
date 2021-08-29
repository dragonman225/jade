import * as React from 'react'
import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'
import { Action } from '../../core/store/actions'

const styles = stylesheet({
  StatNavItem: {
    fontSize: '.8rem',
    padding: theme.paddings.navComfort,
    maxHeight: '100%',
    background: 'aquamarine',
  },
  StatBlock: {
    userSelect: 'none',
    padding: theme.paddings.blockComfort,
    $nest: {
      '& code': {
        fontSize: '.9rem',
        color: 'firebrick',
        background: 'mistyrose',
        padding: '.1rem .3rem',
        borderRadius: '.3rem',
        cursor: 'pointer',
      },
      '& ul': {
        paddingLeft: '1.5rem',
        margin: '.75rem 0',
      },
    },
  },
  MouseData: {
    $nest: {
      '&>p': {
        margin: 0,
      },
    },
  },
  Highlight: {
    background: 'aquamarine',
  },
})

type Props = ConceptDisplayProps<undefined>

export const Status: React.FunctionComponent<Props> = props => {
  const { state, dispatchAction } = props

  switch (props.viewMode) {
    case 'Block':
      return (
        <div className={styles.StatBlock}>
          <ul>
            <li>
              <code>{state.blocks.length}</code> blocks on the canvas
            </li>
            <li>
              Focusing at{' '}
              <code>
                ({state.camera.focus.x.toFixed(2)},{' '}
                {state.camera.focus.y.toFixed(2)})
              </code>
              , scale <code>{(state.camera.scale * 100).toFixed(2)}%</code>
            </li>
            <li>
              Debugging is{' '}
              <code
                onClick={() =>
                  dispatchAction({
                    type: Action.DebuggingToggle,
                  })
                }>
                {state.debugging ? 'ON' : 'OFF'}
              </code>
            </li>
            <li>
              <code>{state.selecting ? 'Selecting' : 'Not Selecting'}</code>
            </li>
            <li>
              <code
                onClick={() => {
                  function getRandomInt(start: number, end: number): number {
                    const rand = Math.floor(
                      Math.random() * Math.floor(end - start + 1)
                    )
                    return start + rand
                  }
                  for (let i = 0; i < 100; i++) {
                    const pos = {
                      x: getRandomInt(-1000, 1000),
                      y: getRandomInt(-1000, 1000),
                    }
                    dispatchAction({
                      type: Action.ConceptCreate,
                      data: { position: pos },
                    })
                  }
                }}>
                Create 100 blocks
              </code>
            </li>
          </ul>
        </div>
      )
    default:
      return <div className={styles.StatNavItem}>Status</div>
  }
}

export const StatusFactory: Factory = {
  id: 'status',
  name: 'Status',
  component: Status,
}
