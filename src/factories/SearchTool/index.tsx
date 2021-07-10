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
  'Search--Linking': {
    cursor: 'grabbing',
  },
  SearchInput: {
    height: 50,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    $nest: {
      '&>input': {
        outline: 'none',
        border: 'none',
        width: '100%',
        fontSize: '.8rem',
      },
      '&>input::placeholder': {
        color: theme.COLORS.uiGrey,
        fontSize: '.8rem',
      },
    },
  },
  ScrollList: {
    height: '100%',
    maxHeight: 500,
    overflow: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
  ScrollListItem: {
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.BORDERS.smallRadius,
    transition: 'background 0.1s ease-in-out',
    $nest: {
      '&:hover': {
        background: theme.COLORS.bgHover,
      },
      '&:active': {
        background: theme.COLORS.bgActive,
      },
      '&:first-of-type': {
        marginTop: '.5rem',
      },
      '&:last-of-type': {
        marginBottom: '.5rem',
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
  VisualCopy: {
    width: 300,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 99999,
  },
  Pager: {
    display: 'flex',
    padding: '.5rem 1rem',
    fontSize: '.8rem',
    textAlign: 'center',
    color: theme.COLORS.uiGrey,
  },
  Arrow: {
    flex: '0 0 50px',
    padding: '0px 3px',
    borderRadius: theme.BORDERS.smallRadius,
    transition: 'background 0.1s ease-in-out',
    cursor: 'pointer',
    $nest: {
      '&:hover': {
        background: theme.COLORS.bgHover,
      },
      '&:active': {
        background: theme.COLORS.bgActive,
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
  const [s2lStartOffset, setS2lStartOffset] = React.useState<Vec2>({
    x: 0,
    y: 0,
  })
  const [s2lDelta, setS2lDelta] = React.useState<Vec2>({ x: 0, y: 0 })
  const s2lBlockRef = React.useRef<S2LBlock>(null)
  const s2lStartOffsetRef = React.useRef<Vec2>(null)
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
    s2lStartOffsetRef.current = s2lStartOffset
  }, [s2lStartOffset])

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

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const clientCoords = getUnifiedClientCoords(e)

        if (
          state === 'ready' &&
          distance(clientCoords, lastClientCoords) > 3 &&
          s2lBlockRef.current.valid
        ) {
          setMinimized(true)
          setS2lState(S2LState.Linking)
          setS2lStartOffset(vecSub(clientCoords, s2lBlockRef.current.rect))

          state = 'linking'
        } else if (state === 'linking') {
          if (!s2lBlockRef.current.valid) return
          setS2lDelta(vecSub(clientCoords, s2lBlockRef.current.rect))
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
          const s2lBlock = s2lBlockRef.current
          const s2lStartOffset = s2lStartOffsetRef.current
          const s2lDelta = s2lDeltaRef.current
          const state = stateRef.current
          const scale = state.camera.scale

          if (s2lBlock.valid) {
            dispatchAction({
              type: 'block::create',
              data: {
                id: s2lBlock.id,
                position: viewportCoordsToEnvCoords(
                  {
                    x:
                      s2lBlock.rect.left +
                      s2lDelta.x -
                      s2lStartOffset.x * scale,
                    y:
                      s2lBlock.rect.top + s2lDelta.y - s2lStartOffset.y * scale,
                  },
                  stateRef.current.camera
                ),
              },
            })
          } else console.log('s2lBlock is invalid')

          setS2lBlock({ valid: false })
          setS2lStartOffset({ x: 0, y: 0 })
          setS2lDelta({ x: 0, y: 0 })
          setS2lState(S2LState.Idle)
        }

        state = 'idle'
        lastClientCoords = { x: 0, y: 0 }
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
        s2lState === S2LState.Linking && styles['Search--Linking']
      )}
      ref={searchRef}
      onFocus={() => {
        setMinimized(false)
      }}>
      <div className={styles.SearchInput}>
        <input
          placeholder="Search Concepts"
          onChange={e => {
            setText(e.target.value)
            setPage(0)
          }}
        />
      </div>
      {!minimized ? (
        <>
          <div className={styles.ScrollList}>
            <div key={pageNum}>
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
                      <hr className={styles.Divider} />
                    </React.Fragment>
                  )
                })}
            </div>
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
        </>
      ) : (
        <></>
      )}
      {s2lState === S2LState.Linking && s2lBlock.valid ? (
        (function () {
          const concept = database.getConcept(s2lBlock.id)
          const scale = state.camera.scale
          const pos = {
            x: s2lBlock.rect.left + s2lDelta.x - s2lStartOffset.x * scale,
            y: s2lBlock.rect.top + s2lDelta.y - s2lStartOffset.y * scale,
          }

          return props.createOverlay(
            <div
              className={BlockStyles.Block}
              style={{
                transformOrigin: 'top left',
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0px) scale(${scale})`,
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
