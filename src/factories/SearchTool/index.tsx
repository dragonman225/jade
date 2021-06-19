import * as React from 'react'
import { useState } from 'react'
import { stylesheet, classes } from 'typestyle'
import {
  distance,
  getUnifiedClientCoords,
  vecSub,
  viewportCoordsToEnvCoords,
} from '../../core/utils'
import { factoryRegistry } from '..'
import { BlockStyles } from '../../core/components/Block.styles'
import { ConceptDisplayProps, Factory, Vec2 } from '../../core/interfaces'
import { Concept, InitializedConceptData } from '../../core/interfaces/concept'
import theme from '../../theme'

const styles = stylesheet({
  Search: {
    $nest: {
      '& hr': {
        border: 'none',
        borderBottom: `1px solid ${theme.COLORS.uiGreyLight}`,
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
    padding: '.5rem 20px',
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
    padding: '0 20px 0',
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
    borderRadius: '.3rem',
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

type SearchItemContentProps = Pick<
  ConceptDisplayProps<InitializedConceptData>,
  'viewMode' | 'concept' | 'database' | 'state' | 'dispatchAction'
>
const SearchItemContent: React.FunctionComponent<SearchItemContentProps> = props => {
  const { viewMode, concept, database, state, dispatchAction } = props
  return factoryRegistry.createConceptDisplay(concept.summary.type, {
    viewMode,
    readOnly: true,
    concept,
    state,
    dispatchAction,
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

const SearchToolBlock: React.FunctionComponent<Props> = props => {
  const { state, dispatchAction, database } = props

  const searchRef = React.useRef<HTMLDivElement>(null)
  // const getSearchRect = () => {
  //   return searchRef.current.getBoundingClientRect()
  // }
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
  }, [text, higherOrderConcepts, leafConcepts])

  /** Search-to-Link */
  const [s2lState, setS2lState] = React.useState(S2LState.Idle)
  const [s2lBlock, setS2lBlock] = React.useState<S2LBlock>({ valid: false })
  const [_s2lStart, setS2lStart] = React.useState<Vec2>({ x: 0, y: 0 })
  const [s2lDelta, setS2lDelta] = React.useState<Vec2>({ x: 0, y: 0 })
  const s2lBlockRef = React.useRef<S2LBlock>(null)
  const s2lDeltaRef = React.useRef<Vec2>(null)
  const stateRef = React.useRef<Props['state']>(null)

  const handleWindowPointerDown = (e: MouseEvent | TouchEvent) => {
    // HACK: Click outside to minimize.
    if (e.target instanceof Node) {
      if (!searchRef.current.contains(e.target)) {
        setMinimized(true)
      }
    }
  }

  React.useEffect(() => {
    s2lBlockRef.current = s2lBlock
  }, [s2lBlock])

  React.useEffect(() => {
    s2lDeltaRef.current = s2lDelta
  }, [s2lDelta])

  React.useEffect(() => {
    stateRef.current = state
  }, [state])

  React.useEffect(() => {
    const gestureDetector = (() => {
      let state: 'idle' | 'ready' | 'linking' = 'idle'
      let lastClientCoords = { x: 0, y: 0 }
      let startLinkingClientCoords = { x: 0, y: 0 }

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const clientCoords = getUnifiedClientCoords(e)

        if (state === 'ready' && distance(clientCoords, lastClientCoords) > 3) {
          /** S2L */
          setMinimized(true)
          setS2lState(S2LState.Linking)
          setS2lStart(clientCoords)

          startLinkingClientCoords = clientCoords
          state = 'linking'
        } else if (state === 'linking') {
          /** S2L */
          setS2lDelta(vecSub(clientCoords, startLinkingClientCoords))
        }

        lastClientCoords = clientCoords
      }

      const handlePointerUp = (_e: MouseEvent | TouchEvent) => {
        window.removeEventListener('mousemove', handlePointerMove)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchend', handlePointerUp)

        if (state === 'ready') {
          const s2lBlock = s2lBlockRef.current

          if (s2lBlock.valid) {
            dispatchAction({
              type: 'navigation::expand',
              data: { id: s2lBlock.id },
            })
          }
        } else if (state === 'linking') {
          setS2lStart({ x: 0, y: 0 })
          setS2lDelta({ x: 0, y: 0 })

          const s2lBlock = s2lBlockRef.current
          const s2lDelta = s2lDeltaRef.current
          if (s2lBlock.valid) {
            dispatchAction({
              type: 'ref::create',
              data: {
                id: s2lBlock.id,
                position: viewportCoordsToEnvCoords(
                  {
                    x: s2lBlock.rect.left + s2lDelta.x,
                    y: s2lBlock.rect.top + s2lDelta.y,
                  },
                  stateRef.current.camera
                ),
              },
            })
          } else console.log('s2lBlock is invalid')
          setS2lBlock({ valid: false })
          setS2lState(S2LState.Idle)
        }

        state = 'idle'
        lastClientCoords = { x: 0, y: 0 }
        startLinkingClientCoords = { x: 0, y: 0 }
      }

      return {
        handlePointerDown: (e: MouseEvent | TouchEvent) => {
          // HACK: Prevent block being dragged when start from a ScrollListItem.
          if (
            e.target instanceof Element &&
            Array.from(
              searchRef.current.querySelectorAll('.ScrollListItem')
            ).find(el => el.contains(e.target as Element))
          )
            e.stopPropagation()

          state = 'ready'
          const clientCoords = getUnifiedClientCoords(e)
          lastClientCoords = clientCoords

          window.addEventListener('mousemove', handlePointerMove)
          window.addEventListener('touchmove', handlePointerMove)
          window.addEventListener('mouseup', handlePointerUp)
          window.addEventListener('touchend', handlePointerUp)
        },
      }
    })()

    const searchEl = searchRef.current
    searchEl.addEventListener('mousedown', gestureDetector.handlePointerDown)
    searchEl.addEventListener('touchstart', gestureDetector.handlePointerDown)
    window.addEventListener('mousedown', handleWindowPointerDown)
    window.addEventListener('touchstart', handleWindowPointerDown)

    return () => {
      searchEl.removeEventListener(
        'mousedown',
        gestureDetector.handlePointerDown
      )
      searchEl.removeEventListener(
        'touchstart',
        gestureDetector.handlePointerDown
      )
      window.removeEventListener('mousedown', handleWindowPointerDown)
      window.removeEventListener('touchstart', handleWindowPointerDown)
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
                              className={`${styles.ScrollListItem} ScrollListItem`}
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
                              // onMouseDown={handleDragStart}
                              onMouseUp={() => {
                                // dispatchAction({
                                //   type: 'navigation::expand',
                                //   data: { id: concept.id },
                                // })
                              }}>
                              <SearchItemContent
                                concept={concept}
                                viewMode="NavItem"
                                state={state}
                                dispatchAction={dispatchAction}
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
                                state={state}
                                dispatchAction={dispatchAction}
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
            <div
              className={BlockStyles.Block}
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: 300,
              }}>
              <SearchItemContent
                concept={concept}
                database={database}
                dispatchAction={dispatchAction}
                state={state}
                viewMode="Block"
              />
            </div>
          )
        })()
      ) : (
        <></>
      )}
    </div>
  )
}

const SearchTool: React.FunctionComponent<Props> = props => {
  const { viewMode } = props

  if (viewMode !== 'Block') {
    return <span>Search Tool</span>
  } else {
    return <SearchToolBlock {...props} />
  }
}

export const SearchToolFactory: Factory = {
  id: 'searchtool',
  name: 'Search Tool',
  isTool: true,
  component: SearchTool,
}
