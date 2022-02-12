import * as React from 'react'
import { useRef } from 'react'

import { styles } from './index.styles'
import { ConceptPreview } from '../ConceptPreview'
import { useAppState } from '../../core/store/appStateContext'
import { Action } from '../../core/store/actions'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'
import { blockRectManager } from '../../core/utils/blockRectManager'

type Props = ConceptDisplayProps<undefined>

export const RecentTool: React.FunctionComponent<Props> = props => {
  const {
    viewMode,
    blockId: recentToolBlockId,
    dispatchAction,
    database,
  } = props
  const { expandHistory } = useAppState()

  const rRecentEl = useRef<HTMLDivElement>(null)

  if (viewMode !== 'Block') {
    return <span>Recent Tool</span>
  }

  return (
    <div className={styles.Recent} ref={rRecentEl}>
      {(function () {
        const historyToShow: string[] = []

        // TODO: Need improvement
        const width =
          blockRectManager.getMeasuredSize(recentToolBlockId)?.width || 0
        const maxNumToShow = Math.floor(width / 100)

        for (let i = expandHistory.length - 2; i >= 0; i--) {
          const conceptId = expandHistory[i]

          /** Ignore if the slot is unpopulated. */
          if (!conceptId) continue

          /** Ignore repeated visits. */
          if (!historyToShow.find(id => id === conceptId)) {
            historyToShow.push(conceptId)
            if (historyToShow.length >= maxNumToShow) break
          }
        }

        return historyToShow.map(conceptId => (
          <button
            className={styles.RecentBtn}
            onClick={() => {
              dispatchAction({
                type: Action.BlockOpenAsCanvas,
                data: { id: conceptId },
              })
            }}
            key={conceptId}>
            <ConceptPreview
              blockId={recentToolBlockId}
              conceptId={conceptId}
              database={database}
              dispatchAction={dispatchAction}
              viewMode="NavItem"
            />
          </button>
        ))
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
