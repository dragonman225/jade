import * as React from 'react'
import { useState, useEffect } from 'react'

import { styles } from './index.styles'
import { ExpandUp } from '../../core/components/Icons/ExpandUp'
import { ExpandDown } from '../../core/components/Icons/ExpandDown'
import {
  ConceptDisplayProps,
  ConceptId,
  Factory,
  TypedConcept,
} from '../../core/interfaces'
import { Action } from '../../core/store/actions'

const noop = function () {
  return
}

type Props = ConceptDisplayProps<undefined>

function getBacklinksOf(
  conceptId: ConceptId,
  concepts: TypedConcept<unknown>[]
) {
  return concepts.filter(c => !!c.references.find(r => r.to === conceptId))
}

export const InsightTool: React.FunctionComponent<Props> = props => {
  const { viewMode, state, dispatchAction, database, factoryRegistry } = props
  const [backlinks, setBacklinks] = useState<TypedConcept<unknown>[]>([])
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
              Appears in{' '}
              {collapsed &&
                `${backlinks.length} concept${backlinks.length > 1 && 's'}`}
            </div>
            <button onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ExpandUp /> : <ExpandDown />}
            </button>
          </div>
          {!collapsed &&
            backlinks.map(concept => {
              return (
                <React.Fragment key={concept.id}>
                  <div
                    className={styles.InsightItem}
                    onClick={() =>
                      dispatchAction({
                        type: Action.BlockOpenAsCanvas,
                        data: { id: concept.id },
                      })
                    }>
                    {factoryRegistry.createConceptDisplay(
                      concept.summary.type,
                      {
                        viewMode: 'NavItem',
                        readOnly: true,
                        state,
                        concept,
                        dispatchAction,
                        factoryRegistry,
                        database,
                        onChange: noop,
                        onReplace: noop,
                        onInteractionStart: noop,
                        onInteractionEnd: noop,
                      }
                    )}
                  </div>
                  <hr className={styles.Divider} />
                </React.Fragment>
              )
            })}
        </>
      ) : (
        <div className={styles.HeaderText}>Not appearing in any concepts</div>
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
