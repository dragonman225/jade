import * as React from 'react'
import { useContext, useCallback } from 'react'
import { stylesheet } from 'typestyle'

import { Header } from './Header'
import { BlockCounter } from './BlockCount'
import { CanvasMonitor } from './CanvasMonitor'
import {
  generateDataUrl,
  withDateSuffix,
  createFakeLink,
  readAsObject,
} from './utils'
import {
  ConceptDisplayProps,
  Factory,
  PositionType,
  TypedConcept,
} from '../../core/interfaces'
import { Action, ConceptCreatePositionIntent } from '../../core/store/actions'
import { AppStateContext } from '../../core/store/appStateContext'
import { buttonPrimary } from '../../lightComponents'
import theme from '../../theme'

const styles = stylesheet({
  statusCardTitle: {
    width: '100%',
  },
  status: {
    userSelect: 'none',
    padding: theme.paddings.blockComfort,
    $nest: {
      '& button': {
        ...buttonPrimary,
      },
    },
  },
  blockCounter: {
    padding: '0.5rem 0.3rem',
  },
  canvasMonitor: {
    padding: '0.5rem 0.3rem',
  },
  buttons: {
    padding: '0.5rem 0.3rem',
    $nest: {
      '& > button:not(:last-child)': {
        margin: '0 0.3rem 0.3rem 0',
      },
    },
  },
  chooseFileButton: {
    ...buttonPrimary,
    display: 'inline-block',
    textAlign: 'center',
    $nest: {
      ...buttonPrimary.$nest,
      '& > input': { display: 'none' },
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

  const importConcepts = useCallback(
    (concepts: TypedConcept<unknown>[]) => {
      concepts.forEach(c => database.createConcept(c))
    },
    [database]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const files = e.target.files
      if (!files) {
        console.log('"e.target.files" is null.')
        return
      }
      const file = files[0]
      if (file.type && file.type.indexOf('json') === -1) {
        console.log('File is not an json.', file.type, file)
        return
      }
      readAsObject<TypedConcept<unknown>[]>(file)
        .then(concepts => {
          importConcepts(concepts)
        })
        .catch(err => {
          console.error(err)
        })
    },
    [importConcepts]
  )

  switch (props.viewMode) {
    case 'NavItem':
    case 'Block':
      return (
        <div className={styles.status}>
          <Header />
          <div className={styles.blockCounter}>
            <BlockCounter value={state.blocks.length} />
          </div>
          <div className={styles.canvasMonitor}>
            <CanvasMonitor
              focus={state.camera.focus}
              scale={state.camera.scale}
              selecting={state.selecting}
              selectedCount={state.selectedBlockIds.length}
            />
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
            <label className={styles.chooseFileButton}>
              <input type="file" accept=".json" onChange={handleFileSelect} />
              <span>Import concepts</span>
            </label>
          </div>
        </div>
      )
    default:
      return (
        <div className={styles.statusCardTitle}>About Jade &amp; nerd info</div>
      )
  }
}

export const StatusFactory: Factory = {
  id: 'status',
  name: 'Status',
  component: Status,
  toText: () => {
    return 'status, About Jade & nerd info'
  },
}
