import * as React from 'react'
import { stylesheet } from 'typestyle'

import theme from '../../theme'
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

const styles = stylesheet({
  Insight: {
    padding: '20px 1rem',
    maxHeight: 500,
    overflow: 'auto',
  },
  InsightItem: {
    position: 'relative',
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.BORDERS.smallRadius,
    transition: 'background 0.1s ease-in-out',
    $nest: {
      '&:hover': {
        background: theme.COLORS.bgHover,
        opacity: 0.9,
      },
      '&:active': {
        background: theme.COLORS.bgActive,
        opacity: 0.8,
      },
    },
  },
  InfoText: {
    marginBottom: '.5rem',
    color: theme.COLORS.uiGrey,
    fontSize: '.8rem',
    $nest: {
      '&:last-child': {
        marginBottom: 0,
      },
    },
  },
  Divider: {
    border: 'none',
    borderBottom: `1px solid ${theme.COLORS.uiGreyLight}`,
    $nest: {
      '&:last-of-type': {
        display: 'none',
      },
    },
  },
})

function getBacklinksOf(
  conceptId: ConceptId,
  concepts: TypedConcept<unknown>[]
) {
  return concepts.filter(c => !!c.references.find(r => r.to === conceptId))
}

export const InsightTool: React.FunctionComponent<Props> = props => {
  const { viewMode, state, dispatchAction, database, factoryRegistry } = props
  const [backlinks, setBacklinks] = React.useState<TypedConcept<unknown>[]>([])

  React.useEffect(() => {
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
          <div className={styles.InfoText}>Appears in</div>
          {backlinks.map(concept => {
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
                <hr className={styles.Divider} />
              </React.Fragment>
            )
          })}
        </>
      ) : (
        <div className={styles.InfoText}>Not appearing in any concepts.</div>
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
