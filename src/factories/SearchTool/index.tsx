import * as React from 'react'
import { useState } from 'react'
import { stylesheet, classes } from 'typestyle'
import { Block } from '../../core/Block'
import { Box } from '../../core/component/Box'
import { isPointInRect } from '../../core/lib/utils'
import { factoryRegistry } from '..'
import {
  ConceptDisplayProps,
  Factory,
  UnifiedEventInfo,
  Vec2,
} from '../../core/interfaces'
import { Concept, InitializedConceptData } from '../../core/interfaces/concept'

const styles = stylesheet({
  Search: {
    $nest: {
      '& hr': {
        border: '1px solid #ddd',
        $nest: {
          '&:last-of-type': {
            display: 'none',
          },
        },
      },
    },
  },
  'Search--Linking': {
    cursor: 'grabbing',
  },
  SearchInput: {
    height: 50,
    padding: '.5rem 22px',
    $nest: {
      '&>input': {
        outline: 'none',
        border: 'none',
        width: '100%',
        height: '100%',
      },
    },
  },
  SearchResult: {
    padding: '0 22px 0',
  },
  ScrollList: {
    height: '100%',
    maxHeight: 500,
    overflow: 'auto',
  },
  ScrollListItem: {
    maxHeight: 200,
    overflow: 'hidden',
    margin: 0,
    borderRadius: 'var(--border-radius-large)',
    transition: 'background 0.1s',
    $nest: {
      '&:hover': {
        background: 'var(--bg-hover)',
      },
      '&:first-of-type': {
        marginTop: '.5rem',
      },
      '&:last-of-type': {
        marginBottom: '.5rem',
      },
    },
  },
  VisualCopy: {
    width: 300,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 99999,
  },
  Pager: {
    display: 'flex',
    padding: '.5rem',
    fontSize: '.8rem',
    textAlign: 'center',
    color: '#666',
  },
  Arrow: {
    flex: '0 0 50px',
    padding: '0px 3px',
    borderRadius: '8px',
    transition: 'background 0.1s',
    $nest: {
      '&:hover': {
        background: 'var(--bg-hover)',
      },
    },
  },
  Info: {
    flex: '1 1 0px',
  },
})

interface SearchItemContentProps
  extends Pick<
    ConceptDisplayProps<InitializedConceptData>,
    'viewMode' | 'messageBus' | 'app' | 'database'
  > {
  concept: Concept
}

const SearchItemContent: React.FunctionComponent<SearchItemContentProps> = props => {
  const { concept, viewMode, messageBus, app, database } = props
  return factoryRegistry.createConceptDisplay(concept.summary.type, {
    viewMode,
    readOnly: true,
    content: concept.summary.data,
    messageBus,
    app,
    factoryRegistry,
    database,
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
  })
}

type Props = ConceptDisplayProps<undefined>

interface S2LBlockValid {
  valid: true
  id: string
  rect: DOMRect
}

interface S2LBlockInvalid {
  valid: false
}

type S2LBlock = S2LBlockValid | S2LBlockInvalid

const S2LState = {
  Idle: Symbol('idle'),
  Linking: Symbol('linking'),
}

const SearchTool: React.FunctionComponent<Props> = props => {
  const { app, messageBus, database } = props
  const searchRef = React.useRef<HTMLDivElement>()
  const getSearchRect = () => {
    return searchRef.current.getBoundingClientRect()
  }
  const [text, setText] = React.useState('')
  const [minimized, setMinimized] = React.useState(true)

  const [higherOrderConcepts, leafConcepts] = React.useMemo(() => {
    const allConcepts = database.getAllConcepts()
    return [
      allConcepts.filter(concept => Concept.isHighOrder(concept)),
      allConcepts.filter(concept => !Concept.isHighOrder(concept)),
    ]
  }, [text, database.getLastUpdatedTime()])

  const resultConcepts = React.useMemo(() => {
    if (text) {
      const match = (concept: Concept) => {
        return Concept.includesText(concept, text)
      }
      const resHighOrderConcepts = higherOrderConcepts.filter(match)
      const resLeafConcepts = leafConcepts.filter(match)
      return resHighOrderConcepts.concat(resLeafConcepts)
    } else {
      return higherOrderConcepts.concat(leafConcepts)
    }
  }, [higherOrderConcepts, leafConcepts])

  /** Search-to-Link */
  const [s2lState, setS2lState] = React.useState(S2LState.Idle)
  const [s2lBlock, setS2lBlock] = React.useState<S2LBlock>({ valid: false })
  const [s2lStart, setS2lStart] = React.useState<Vec2>({ x: 0, y: 0 })
  const [s2lDelta, setS2lDelta] = React.useState<Vec2>({ x: 0, y: 0 })

  const handleDragStart = (e: UnifiedEventInfo) => {
    if (s2lState === S2LState.Idle && s2lBlock.valid) {
      setMinimized(true)
      setS2lState(S2LState.Linking)
      setS2lStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleDragging = (e: UnifiedEventInfo) => {
    if (s2lState === S2LState.Linking) {
      setS2lDelta({ x: e.clientX - s2lStart.x, y: e.clientY - s2lStart.y })
    }
  }

  const handleDragEnd = (e: UnifiedEventInfo) => {
    if (s2lState === S2LState.Linking) {
      setS2lStart({ x: 0, y: 0 })
      setS2lDelta({ x: 0, y: 0 })
      if (s2lBlock.valid) {
        app.dispatch({
          type: 'link::create',
          data: {
            id: s2lBlock.id,
            position: {
              x: s2lBlock.rect.left + s2lDelta.x,
              y: s2lBlock.rect.top + s2lDelta.y - e.originY,
            },
          },
        })
      } else console.log('s2lBlock is invalid')
      setS2lBlock({ valid: false })
      setS2lState(S2LState.Idle)
    }
  }

  const handleTap = (e: UnifiedEventInfo) => {
    const point = {
      x: e.clientX,
      y: e.clientY,
    }
    if (!isPointInRect(point, getSearchRect())) {
      setMinimized(true)
    }
  }

  React.useEffect(() => {
    messageBus.subscribe('user::dragstart', handleDragStart)
    messageBus.subscribe('user::dragging', handleDragging)
    messageBus.subscribe('user::dragend', handleDragEnd)
    messageBus.subscribe('user::tap', handleTap)
    return () => {
      messageBus.unsubscribe('user::dragstart', handleDragStart)
      messageBus.unsubscribe('user::dragging', handleDragging)
      messageBus.unsubscribe('user::dragend', handleDragEnd)
      messageBus.unsubscribe('user::tap', handleTap)
    }
  })

  const [pageNum, setPage] = useState<number>(0)
  const itemsPerPage = 20
  const startItemIndex = pageNum * itemsPerPage
  const nextStartItemIndex = (pageNum + 1) * itemsPerPage

  function isFirstPage() {
    return pageNum === 0
  }

  function isLastPage() {
    return nextStartItemIndex > resultConcepts.length - 1
  }

  return (
    <div
      className={classes(
        styles.Search,
        s2lState === S2LState.Linking && styles['Search--Linking']
      )}
      ref={searchRef}
      onFocus={() => {
        setMinimized(false)
      }}>
      <div className={styles.SearchInput}>
        <input
          placeholder="Search here..."
          onChange={e => {
            setText(e.target.value)
            setPage(0)
          }}
        />
      </div>
      {!minimized ? (
        <div className={styles.SearchResult}>
          <div className={styles.ScrollList} key={pageNum}>
            {resultConcepts
              .slice(startItemIndex, nextStartItemIndex)
              .map(concept => {
                return (
                  <React.Fragment key={concept.id}>
                    {(function () {
                      switch (s2lState) {
                        case S2LState.Idle: {
                          /** The following doesn't support touch. */
                          return (
                            <div
                              className={styles.ScrollListItem}
                              onMouseEnter={e => {
                                setS2lBlock({
                                  valid: true,
                                  id: concept.id,
                                  rect: e.currentTarget.getBoundingClientRect(),
                                })
                              }}
                              onMouseLeave={() => {
                                setS2lBlock({ valid: false })
                              }}
                              onMouseUp={() => {
                                app.dispatch({
                                  type: 'navigation::expand',
                                  data: { id: concept.id },
                                })
                              }}>
                              <SearchItemContent
                                concept={concept}
                                viewMode="NavItem"
                                messageBus={messageBus}
                                app={app}
                                database={database}
                              />
                            </div>
                          )
                        }
                        case S2LState.Linking: {
                          return (
                            <div className={styles.ScrollListItem}>
                              <SearchItemContent
                                concept={concept}
                                viewMode="NavItem"
                                messageBus={messageBus}
                                app={app}
                                database={database}
                              />
                            </div>
                          )
                        }
                        default: {
                          return `Unknown s2lState "${s2lState.description}"`
                        }
                      }
                    })()}
                    <hr />
                  </React.Fragment>
                )
              })}
          </div>
          <div className={styles.Pager}>
            <div
              className={styles.Arrow}
              onClick={() => {
                if (!isFirstPage()) setPage(pageNum - 1)
              }}>
              Prev
            </div>
            <div className={styles.Info}>
              {startItemIndex + 1} ~{' '}
              {Math.min(startItemIndex + itemsPerPage, resultConcepts.length)}{' '}
              of {resultConcepts.length}
            </div>
            <div
              className={styles.Arrow}
              onClick={() => {
                if (!isLastPage()) setPage(pageNum + 1)
              }}>
              Next
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      {s2lState === S2LState.Linking && s2lBlock.valid ? (
        (function () {
          const concept = database.getConcept(s2lBlock.id)
          const position = {
            x: s2lBlock.rect.left + s2lDelta.x,
            y: s2lBlock.rect.top + s2lDelta.y,
          }
          return props.createOverlay(
            <Block
              readOnly={true}
              data={{
                blockId: concept.id,
                position,
                width: 300,
              }}
              origin={{
                type: 'TL',
                top: 0,
                left: 0,
              }}
              zIndex={9999}
              container={Box}
              onResize={() => {
                return
              }}
              onMove={() => {
                return
              }}
              messenger={messageBus}>
              {() => (
                <SearchItemContent
                  concept={concept}
                  viewMode="Block"
                  messageBus={messageBus}
                  app={app}
                  database={database}
                />
              )}
            </Block>
          )
        })()
      ) : (
        <></>
      )}
    </div>
  )
}

export const SearchToolFactory: Factory = {
  id: 'searchtool',
  name: 'Search Tool',
  isTool: true,
  component: SearchTool,
}
