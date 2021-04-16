import * as React from 'react'
import { useMemo } from 'react'
import { stylesheet } from 'typestyle'
import { Content } from '..'
import { ConceptDisplayProps } from '../../core/interfaces'

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
  const { app, database } = props
  const parentConcepts = useMemo(() => {
    const allConcepts = database.getAllConcepts()
    return allConcepts.filter(concept => {
      return !!concept.details.find(
        link => link.to === app.state.viewingConcept.id
      )
    })
  }, [app.state.viewingConcept.id, database.getLastUpdatedTime()])

  return (
    <div className={styles.Insight}>
      {parentConcepts.length ? (
        <>
          <h3>Embedded in</h3>
          {parentConcepts.map(concept => {
            return (
              <React.Fragment key={concept.id}>
                <div
                  className={styles.InsightItem}
                  onClick={() =>
                    app.dispatch({
                      type: 'navigation::expand',
                      data: { id: concept.id },
                    })
                  }>
                  <Content
                    contentType={concept.summary.type}
                    contentProps={{
                      viewMode: 'NavItem',
                      readOnly: true,
                      content: concept.summary.data,
                      messageBus: {
                        subscribe: noop,
                        unsubscribe: noop,
                        publish: noop,
                      },
                      app,
                      database,
                      onChange: noop,
                      onReplace: noop,
                      onInteractionStart: noop,
                      onInteractionEnd: noop,
                    }}
                  />
                </div>
                <hr />
              </React.Fragment>
            )
          })}
        </>
      ) : (
        <p>This concept is not embedded in any concepts.</p>
      )}
    </div>
  )
}
