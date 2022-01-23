import * as React from 'react'
import { useState, useEffect, useContext } from 'react'

import { styles } from './index.styles'
import { Backlink, getBacklinksOf } from './backlink'
import { AppStateContext } from '../../core/store/appStateContext'
import { ExpandUp } from '../../core/components/Icons/ExpandUp'
import { ExpandDown } from '../../core/components/Icons/ExpandDown'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'
import { Action } from '../../core/store/actions'
import { ConceptPreview } from '../ConceptPreview'

type Props = ConceptDisplayProps<undefined>

export const InsightTool: React.FunctionComponent<Props> = props => {
  const {
    viewMode,
    blockId: insightToolBlockId,
    dispatchAction,
    database,
  } = props
  const state = useContext(AppStateContext)
  const [backlinks, setBacklinks] = useState<Backlink[]>([])
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    // TODO: Can we avoid re-subscribing when text or minimized changes?
    const updateBacklinks = () => {
      const concepts = database.getAllConcepts()
      const backlinks = getBacklinksOf(state.viewingConcept.id, concepts)
      setBacklinks(backlinks)
    }

    updateBacklinks()

    // database.subscribeConcept('*', updateBacklinks)

    // return () => {
    //   database.unsubscribeConcept('*', updateBacklinks)
    // }
  }, [database, state.viewingConcept.id])

  if (viewMode !== 'Block') {
    return <span>Insight Tool</span>
  }

  return (
    <div className={styles.Insight}>
      {backlinks.length ? (
        <>
          <div className={styles.Header}>
            <div className={styles.HeaderText}>
              Embedded at{' '}
              {collapsed &&
                `${backlinks.length} place${backlinks.length > 1 ? 's' : ''}`}
            </div>
            <button onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ExpandUp /> : <ExpandDown />}
            </button>
          </div>
          {!collapsed &&
            backlinks.map(({ concept, blockId }) => {
              return (
                <React.Fragment key={`${concept.id}/${blockId}`}>
                  <div
                    className={styles.InsightItem}
                    onClick={() =>
                      dispatchAction({
                        type: Action.BlockOpenAsCanvas,
                        data: { id: concept.id, focusBlockId: blockId },
                      })
                    }>
                    <ConceptPreview
                      blockId={insightToolBlockId}
                      conceptId={concept.id}
                      database={database}
                      dispatchAction={dispatchAction}
                      viewMode="NavItem"
                    />
                  </div>
                  <hr className={styles.Divider} />
                </React.Fragment>
              )
            })}
        </>
      ) : (
        <div className={styles.HeaderText}>Not embedded anywhere</div>
      )}
    </div>
  )
}

export const InsightToolFactory: Factory = {
  id: 'insighttool',
  name: 'Insight Tool',
  isTool: true,
  component: InsightTool,
}
