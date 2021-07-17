import * as React from 'react'
import { useRef } from 'react'

import { styles } from './index.styles'
import { Action } from '../../core/store/actions'
import {
  ConceptDisplayProps,
  Factory,
  InitializedConceptData,
} from '../../core/interfaces'

type Props = ConceptDisplayProps<undefined>

export const RecentTool: React.FunctionComponent<Props> = props => {
  const { viewMode, state, dispatchAction, database, factoryRegistry } = props

  const recentRef = useRef<HTMLDivElement>(null)

  if (viewMode !== 'Block') {
    return <span>Recent Tool</span>
  }

  return (
    <div className={styles.Recent} ref={recentRef}>
      {(function () {
        const historyToShow: string[] = []
        const maxNumToShow = Math.floor(
          // TODO: Think of a way to pass down block elegantly.
          recentRef.current?.getBoundingClientRect().width / 100
        )

        for (let i = state.expandHistory.length - 2; i >= 0; i--) {
          const conceptId = state.expandHistory[i]

          /** Ignore if the slot is unpopulated. */
          if (!conceptId) continue

          /** Ignore repeated visits. */
          if (!historyToShow.find(id => id === conceptId)) {
            historyToShow.push(conceptId)
            if (historyToShow.length >= maxNumToShow) break
          }
        }

        return historyToShow.map(conceptId => {
          const concept = database.getConcept(conceptId)
          const contentProps: ConceptDisplayProps<InitializedConceptData> = {
            viewMode: 'NavItem',
            readOnly: true,
            concept,
            state,
            dispatchAction,
            database,
            factoryRegistry,
            onChange: () => {
              return
            },
            onReplace: () => {
              return
            },
            onInteractionStart: () => {
              return
            },
            onInteractionEnd: () => {
              return
            },
          }
          return (
            <button
              className={styles.RecentBtn}
              onClick={() => {
                dispatchAction({
                  type: Action.BlockOpenAsCanvas,
                  data: { id: conceptId },
                })
              }}
              key={conceptId}>
              {factoryRegistry.createConceptDisplay(
                concept.summary.type,
                contentProps
              )}
            </button>
          )
        })
      })()}
    </div>
  )
}

export const RecentToolFactory: Factory = {
  id: 'recenttool',
  name: 'Recent Tool',
  isTool: true,
  component: RecentTool,
}
