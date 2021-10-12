import * as React from 'react'
import { useContext, useCallback } from 'react'
import { stylesheet } from 'typestyle'

import { BlockCounter } from './BlockCount'
import { Header } from './Header'
import { generateDataUrl, withDateSuffix, createFakeLink } from './utils'
import theme from '../../theme'
import { buttonPrimary } from '../../lightComponents'
import { AppStateContext } from '../../core/store/appStateContext'
import {
  ConceptDisplayProps,
  Factory,
  PositionType,
} from '../../core/interfaces'
import { Action, ConceptCreatePositionIntent } from '../../core/store/actions'

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
      '& button': {
        ...buttonPrimary,
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
  blockCounter: {
    padding: '0.3rem',
  },
  buttons: {
    padding: '0.7rem 0.3rem',
    $nest: {
      '& > button:not(:last-child)': {
        margin: '0 0.3rem 0.3rem 0',
      },
    },
  },
})

type Props = ConceptDisplayProps<undefined>

export const Status: React.FunctionComponent<Props> = props => {
  const { dispatchAction, database } = props
  const state = useContext(AppStateContext)

  const generateRandomBlocks = useCallback(() => {
    function getRandomInt(start: number, end: number): number {
      const rand = Math.floor(Math.random() * Math.floor(end - start + 1))
      return start + rand
    }
    for (let i = 0; i < 100; i++) {
      const pos = {
        x: getRandomInt(-1000, 1000),
        y: getRandomInt(-1000, 1000),
      }
      dispatchAction({
        type: Action.ConceptCreate,
        data: {
          posType: PositionType.Normal,
          intent: ConceptCreatePositionIntent.ExactAt,
          pointerInViewportCoords: pos,
        },
      })
    }
  }, [dispatchAction])

  const exportAllConcepts = useCallback(() => {
    const href = generateDataUrl(
      JSON.stringify(database.getAllConcepts()),
      'application/json'
    )
    const filename = `${withDateSuffix('all-concepts')}.json`
    const link = createFakeLink()
    link.href = href
    link.download = filename
    link.click()
  }, [database])

  switch (props.viewMode) {
    case 'NavItem':
    case 'Block':
      return (
        <div className={styles.StatBlock}>
          <Header />
          <div className={styles.blockCounter}>
            <BlockCounter value={state.blocks.length} />
          </div>
          <div className={styles.buttons}>
            <button
              onClick={() =>
                dispatchAction({
                  type: Action.DebuggingToggle,
                })
              }>
              {state.debugging
                ? 'Virtualized rendering: OFF'
                : 'Virtualized rendering: ON'}
            </button>
            <button onClick={generateRandomBlocks}>Create 100 blocks</button>
            <button onClick={exportAllConcepts}>Export all concepts</button>
          </div>
          <ul>
            <li>
              Focusing at{' '}
              <code>
                ({state.camera.focus.x.toFixed(1)},{' '}
                {state.camera.focus.y.toFixed(1)})
              </code>
              , scale <code>{(state.camera.scale * 100).toFixed(1)}%</code>
            </li>
            <li>
              <code>{state.selecting ? 'Selecting' : 'Not Selecting'}</code>
            </li>
          </ul>
        </div>
      )
    default:
      return (
        <div className={styles.StatNavItem}>About Jade &amp; nerd info</div>
      )
  }
}

export const StatusFactory: Factory = {
  id: 'status',
  name: 'Status',
  component: Status,
  toText: () => {
    return 'status, About Jade &amp; nerd info'
  },
}
