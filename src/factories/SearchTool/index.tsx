import * as React from 'react'
import { useState, useContext, useRef, useEffect, useMemo } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.style'
import { Search } from '../../core/components/Icons/Search'
import { SlashHint } from '../../core/components/Icons/Slash'
import { AppStateContext } from '../../core/store/appStateContext'
import {
  distance,
  getUnifiedClientCoords,
  vecSub,
  viewportCoordsToEnvCoords,
} from '../../core/utils'
import { factoryRegistry } from '..'
import { styles as blockStyles } from '../../core/components/Block.styles'
import {
  Concept,
  ConceptDisplayProps,
  Factory,
  TypedConcept,
  Vec2,
} from '../../core/interfaces'
import { Action } from '../../core/store/actions'
import { usePager } from './usePager'

function noop() {
  return
}

type SearchItemContentProps = Pick<
  ConceptDisplayProps<unknown>,
  'viewMode' | 'concept' | 'database' | 'dispatchAction' | 'blockId'
>
const ContentPreview: React.FunctionComponent<SearchItemContentProps> = props => {
  const { viewMode, concept, database, dispatchAction, blockId } = props
  return (
    <div className={styles.ContentPreview}>
      {factoryRegistry.createConceptDisplay(concept.summary.type, {
        viewMode,
        blockId,
        readOnly: true,
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
  )
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

function getSearchResult(keyword: string, concepts: TypedConcept<unknown>[]) {
  const conceptsWithChildren = []
  const conceptsWithoutChildren = []

  for (let i = 0; i < concepts.length; ++i) {
    const c = concepts[i]

    if (keyword && !Concept.includesText(c, keyword)) continue

    if (Concept.isHighOrder(c)) conceptsWithChildren.push(c)
    else conceptsWithoutChildren.push(c)
  }

  const comparator = (c1: TypedConcept<unknown>, c2: TypedConcept<unknown>) => {
    const mtimeC1 = c1.lastEditedTime || 0
    const mtimeC2 = c2.lastEditedTime || 0
    return mtimeC2 - mtimeC1
  }
  const sortedConceptsWithChildren = conceptsWithChildren.sort(comparator)
  const sortedConceptsWithoutChildren = conceptsWithoutChildren.sort(comparator)

  return {
    canvasConcepts: sortedConceptsWithChildren,
    blockConcepts: sortedConceptsWithoutChildren,
  }
}

const SearchToolBlock: React.FunctionComponent<Props> = props => {
  const { dispatchAction, database, blockId } = props
  const state = useContext(AppStateContext)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [minimized, setMinimized] = useState(true)
  const [tab, setTab] = useState<'canvas' | 'block'>('canvas')
  const result = useMemo(() => {
    return getSearchResult(text, database.getAllConcepts())
    /** Should re-run on minimized change. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, database, minimized])
  const resultConcepts =
    tab === 'canvas' ? result.canvasConcepts : result.blockConcepts

  /** Search-to-Link */
  const [s2lState, setS2lState] = useState(S2LState.Idle)
  const [s2lBlock, setS2lBlock] = useState<S2LBlock>({ valid: false })
  const [s2lStartOffset, setS2lStartOffset] = useState<Vec2>({
    x: 0,
    y: 0,
  })
  const [s2lDelta, setS2lDelta] = useState<Vec2>({ x: 0, y: 0 })
  const s2lBlockRef = useRef<S2LBlock>(null)
  const s2lStartOffsetRef = useRef<Vec2>(null)
  const s2lDeltaRef = useRef<Vec2>(null)
  const stateRef = useRef<typeof state>(null)

  const handleWindowPointerDown = (e: MouseEvent | TouchEvent) => {
    /** Click outside to minimize. */
    if (e.target instanceof Node) {
      if (!searchRef.current.contains(e.target)) {
        setMinimized(true)
      }
    }
  }

  useEffect(() => {
    s2lBlockRef.current = s2lBlock
  }, [s2lBlock])

  useEffect(() => {
    s2lStartOffsetRef.current = s2lStartOffset
  }, [s2lStartOffset])

  useEffect(() => {
    s2lDeltaRef.current = s2lDelta
  }, [s2lDelta])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
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
              type: Action.BlockOpenAsCanvas,
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
              type: Action.BlockCreate,
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
        handleKeyDown: (e: KeyboardEvent) => {
          if (state !== 'idle') return
          /** Only when there is no other focus. */
          if (e.key === '/' && document.activeElement === document.body) {
            inputRef.current && inputRef.current.focus()
            e.preventDefault() /** Prevent "/" being typed. */
          } else if (
            e.key === 'Escape' &&
            document.activeElement === inputRef.current
          ) {
            inputRef.current && inputRef.current.blur()
            setMinimized(true)
          }
        },
      }
    })()

    const searchEl = searchRef.current
    searchEl.addEventListener('mousedown', gestureDetector.handlePointerDown)
    searchEl.addEventListener('touchstart', gestureDetector.handlePointerDown)
    window.addEventListener('mousedown', handleWindowPointerDown)
    window.addEventListener('touchstart', handleWindowPointerDown)
    window.addEventListener('keydown', gestureDetector.handleKeyDown)

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
      window.removeEventListener('keydown', gestureDetector.handleKeyDown)
    }
  }, [dispatchAction])

  const itemsPerPage = 20
  const canvasPager = usePager(result.canvasConcepts, itemsPerPage)
  const blocksPager = usePager(result.blockConcepts, itemsPerPage)
  const { page, start, nextStart, goPrevPage, goNextPage, resetPage } =
    tab === 'canvas' ? canvasPager : blocksPager

  return (
    <div
      className={classes(
        s2lState === S2LState.Linking && styles['Search--Linking']
      )}
      ref={searchRef}>
      <div className={styles.SearchBar}>
        <div className={styles.SearchIcon}>
          <Search />
        </div>
        <input
          ref={inputRef}
          className={styles.SearchInput}
          placeholder="Search"
          onChange={e => {
            setText(e.target.value)
            resetPage()
          }}
          onFocus={() => {
            setMinimized(false)
          }}
        />
        {minimized && (
          <div className={styles.SearchShortcutHint}>
            <SlashHint />
          </div>
        )}
      </div>
      {!minimized ? (
        <>
          <div className={styles.Tab}>
            <button
              className={classes(
                styles.TabButton,
                tab === 'canvas' && styles.Selected
              )}
              onClick={() => setTab('canvas')}>
              Canvas ({result.canvasConcepts.length})
            </button>
            <button
              className={classes(
                styles.TabButton,
                tab === 'block' && styles.Selected
              )}
              onClick={() => setTab('block')}>
              Block ({result.blockConcepts.length})
            </button>
          </div>
          <div className={styles.ScrollList}>
            <div key={page}>
              {resultConcepts.slice(start, nextStart).map(concept => {
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
                              <ContentPreview
                                blockId={blockId}
                                concept={concept}
                                viewMode="NavItem"
                                dispatchAction={dispatchAction}
                                database={database}
                              />
                            </div>
                          )
                        }
                        case S2LState.Linking: {
                          return (
                            <div className={styles.ScrollListItem}>
                              <ContentPreview
                                blockId={blockId}
                                concept={concept}
                                viewMode="NavItem"
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
          <div className={styles.PageBar}>
            <div className={styles.Arrow} onClick={() => goPrevPage()}>
              Prev
            </div>
            <div className={styles.Info}>
              {start + 1} ~{' '}
              {Math.min(start + itemsPerPage, resultConcepts.length)} of{' '}
              {resultConcepts.length}
            </div>
            <div className={styles.Arrow} onClick={() => goNextPage()}>
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
              className={blockStyles.Block}
              style={{
                transformOrigin: 'top left',
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0px) scale(${scale})`,
                width: 300,
                pointerEvents: 'none', // Since we use `viewMode: 'Block'` here.
              }}>
              <ContentPreview
                blockId={blockId}
                concept={concept}
                database={database}
                dispatchAction={dispatchAction}
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
