import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as typestyle from 'typestyle'
import { Content } from '../content/Content'
import { isPointInRect } from '../lib/utils'
import { ContentProps, State3, UnifiedEventInfo, Vec2 } from './interfaces'
import { Concept, InitializedConceptData } from './interfaces/concept'
import { IPubSub } from '../lib/pubsub'
import { Box } from './component/Box'
import { Block } from './Block'

interface SearchItemContentProps
  extends Pick<ContentProps<InitializedConceptData>, 'viewMode' | 'messageBus'> {
  concept: Concept
}

const SearchItemContent: React.FunctionComponent<SearchItemContentProps> = (props) => {
  const { concept, viewMode, messageBus } = props
  return (
    <Content
      contentType={concept.summary.type}
      contentProps={{
        viewMode,
        readOnly: true,
        content: concept.summary.data,
        messageBus,
        onChange: () => { return },
        onReplace: () => { return },
        onInteractionStart: () => { return },
        onInteractionEnd: () => { return },
      }} />
  )
}

interface Props {
  state: State3
  portal: React.MutableRefObject<HTMLDivElement>
  onExpand: (conceptId: string) => void
  onRequestLink: (data: { id: string; position: Vec2 }) => void
  messenger: IPubSub
}

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
  Linking: Symbol('linking')
}

export const SearchTool: React.FunctionComponent<Props> = (props) => {
  const { messenger } = props
  const searchRef = React.useRef<HTMLDivElement>()
  const getSearchRect = () => {
    return searchRef.current.getBoundingClientRect()
  }
  const [text, setText] = React.useState('')
  const [minimized, setMinimized] = React.useState(true)

  const [higherOrderConcepts, leafConcepts] = React.useMemo(() => {
    const allConcepts = Object.values(props.state.conceptMap)
    return [
      allConcepts.filter(concept => Concept.isHighOrder(concept)),
      allConcepts.filter(concept => !Concept.isHighOrder(concept))
    ]
  }, [text, props.state.conceptMap])

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

  const styles = {
    Search: typestyle.style({
      $nest: {
        '& hr': {
          border: '1px solid #ddd',
          $nest: {
            '&:last-of-type': {
              display: 'none'
            }
          }
        }
      }
    }),
    'Search--Linking': typestyle.style({
      cursor: 'grabbing'
    }),
    SearchInput: typestyle.style({
      height: 50,
      padding: '.5rem 22px',
      $nest: {
        '&>input': {
          outline: 'none',
          border: 'none',
          width: '100%',
          height: '100%'
        }
      }
    }),
    SearchResult: typestyle.style({
      padding: '0 22px 0'
    }),
    ScrollList: typestyle.style({
      height: '100%',
      maxHeight: '500px',
      overflow: 'auto'
    }),
    ScrollListItem: typestyle.style({
      maxHeight: '200px',
      overflow: 'hidden',
      margin: 0,
      borderRadius: '.5rem',
      $nest: {
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.1)'
        },
        '&:first-of-type': {
          marginTop: '.5rem'
        },
        '&:last-of-type': {
          marginBottom: '.5rem'
        }
      }
    }),
    VisualCopy: typestyle.style({
      width: 300,
      maxHeight: 200,
      overflow: 'hidden',
      zIndex: 99999
    }),
  }

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
        console.log(s2lBlock, s2lDelta)
        props.onRequestLink({
          id: s2lBlock.id,
          position: {
            x: s2lBlock.rect.left + s2lDelta.x,
            y: s2lBlock.rect.top + s2lDelta.y - e.originY
          }
        })
      }
      else
        console.log('s2lBlock is invalid')
      setS2lBlock({ valid: false })
      setS2lState(S2LState.Idle)
    }
  }

  const handleTap = (e: UnifiedEventInfo) => {
    const point = {
      x: e.clientX,
      y: e.clientY
    }
    if (!isPointInRect(point, getSearchRect())) {
      setMinimized(true)
    }
  }

  React.useEffect(() => {
    messenger.subscribe('user::dragstart', handleDragStart)
    messenger.subscribe('user::dragging', handleDragging)
    messenger.subscribe('user::dragend', handleDragEnd)
    messenger.subscribe('user::tap', handleTap)
    return () => {
      messenger.unsubscribe('user::dragstart', handleDragStart)
      messenger.unsubscribe('user::dragging', handleDragging)
      messenger.unsubscribe('user::dragend', handleDragEnd)
      messenger.unsubscribe('user::tap', handleTap)
    }
  })

  return (
    <div
      className={typestyle.classes(
        styles.Search,
        s2lState === S2LState.Linking && styles['Search--Linking'])}
      ref={searchRef}
      onFocus={() => { setMinimized(false) }}>
      {
        !minimized ?
          <div className={styles.SearchResult}>
            <div className={styles.ScrollList}>
              {
                resultConcepts.map(concept => {
                  return <React.Fragment key={concept.id}>
                    {
                      function () {
                        switch (s2lState) {
                          case S2LState.Idle: {
                            /** The following doesn't support touch. */
                            return <div className={styles.ScrollListItem}
                              onMouseEnter={(e) => {
                                setS2lBlock({
                                  valid: true,
                                  id: concept.id,
                                  rect: e.currentTarget.getBoundingClientRect()
                                })
                              }}
                              onMouseLeave={() => {
                                setS2lBlock({ valid: false })
                              }}
                              onMouseUp={() => {
                                props.onExpand(concept.id)
                              }}>
                              <SearchItemContent concept={concept}
                                viewMode="NavItem" messageBus={messenger} />
                            </div>
                          }
                          case S2LState.Linking: {
                            return <div className={styles.ScrollListItem}>
                              <SearchItemContent concept={concept}
                                viewMode="NavItem" messageBus={messenger} />
                            </div>
                          }
                        }
                      }()
                    }
                    <hr />
                  </React.Fragment>
                })
              }
            </div>
          </div> :
          <></>
      }
      <div className={styles.SearchInput}>
        <input placeholder="Search here..."
          onChange={(e) => { setText(e.target.value) }} />
      </div>
      {
        function () {
          //console.log(s2lState)
          if (s2lState === S2LState.Linking && s2lBlock.valid) {
            const concept = props.state.conceptMap[s2lBlock.id]
            const position = {
              x: s2lBlock.rect.left + s2lDelta.x,
              y: s2lBlock.rect.top + s2lDelta.y
            }
            return ReactDOM.createPortal(<Block
              readOnly={true}
              data={{
                blockId: concept.id,
                position,
                width: 300
              }}
              origin={{
                type: 'TL',
                top: 0,
                left: 0
              }}
              zIndex={9999}
              container={Box}
              onResize={() => { return }}
              onMove={() => { return }}
              messenger={messenger}>
              {() => <SearchItemContent concept={concept} viewMode="Block"
                messageBus={messenger} />}
            </Block>, props.portal.current)
          }
        }()
      }
    </div>
  )
}