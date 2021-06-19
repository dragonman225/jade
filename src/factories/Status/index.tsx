import * as React from 'react'
import { stylesheet } from 'typestyle'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'
import { InitializedConceptData } from '../../core/interfaces/concept'

const styles = stylesheet({
  StatNavItem: {
    fontSize: '.8rem',
    padding: '.5rem',
    maxHeight: '100%',
    background: 'aquamarine',
  },
  StatBlock: {
    userSelect: 'none',
    padding: '1rem',
    $nest: {
      '& code': {
        fontSize: '.9rem',
        color: 'firebrick',
        background: 'mistyrose',
        padding: '.1rem .3rem',
        borderRadius: '.3rem',
        cursor: 'pointer',
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

type Props = ConceptDisplayProps<InitializedConceptData>

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
                    type: 'debugging::toggle',
                  })
                }>
                {state.debugging ? 'ON' : 'OFF'}
              </code>
            </li>
            <li>
              <code>{state.selecting ? 'Selecting' : 'Not Selecting'}</code>
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
