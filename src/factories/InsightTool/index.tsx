import * as React from 'react'
import { useMemo } from 'react'
import { stylesheet } from 'typestyle'

import { ConceptDisplayProps, Factory } from '../../core/interfaces'

const noop = function () {
  return
}

type Props = ConceptDisplayProps<undefined>

const styles = stylesheet({
  Insight: {
    padding: '22px .5rem',
    $nest: {
      '&>h3': {
        margin: '0 .5rem .5rem',
        color: '#000',
        opacity: 0.7,
        fontSize: '.7rem',
        fontWeight: 'normal',
      },
      '&>hr': {
        border: '1px solid #ddd',
        $nest: {
          '&:last-of-type': {
            display: 'none',
          },
        },
      },
      '&>p': {
        fontSize: '.8rem',
        padding: '.5rem',
        margin: 0,
      },
    },
  },
  InsightItem: {
    maxHeight: 200,
    overflow: 'hidden',
    borderRadius: 'var(--border-radius-large)',
    '&:hover': {
      background: 'var(--bg-hover)',
    },
  },
})

export const InsightTool: React.FunctionComponent<Props> = props => {
  const { state, dispatchAction, database, factoryRegistry } = props
  const parentConcepts = useMemo(() => {
    const allConcepts = database.getAllConcepts()
    return allConcepts.filter(concept => {
      return !!concept.references.find(
        link => link.to === state.viewingConcept.id
      )
    })
  }, [state.viewingConcept.id, database.getLastUpdatedTime()])

  return (
    <div className={styles.Insight}>
      {parentConcepts.length ? (
        <>
          <h3>Appears in</h3>
          {parentConcepts.map(concept => {
            return (
              <React.Fragment key={concept.id}>
                <div
                  className={styles.InsightItem}
                  onClick={() =>
                    dispatchAction({
                      type: 'navigation::expand',
                      data: { id: concept.id },
                    })
                  }>
                  {factoryRegistry.createConceptDisplay(concept.summary.type, {
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
                  })}
                </div>
                <hr />
              </React.Fragment>
            )
          })}
        </>
      ) : (
        <p>Not appearing in any concepts.</p>
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
