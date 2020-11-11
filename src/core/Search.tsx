import * as React from 'react'
import { Content } from '../content/Content'
import { BlockCard, State3, UnifiedEventInfo, Vec2 } from '../interfaces'
import { IPubSub } from '../lib/pubsub'
import { isPointInRect } from '../lib/utils'

interface SearchItemContentProps {
  blockCard: BlockCard
}

const SearchItemContent: React.FunctionComponent<SearchItemContentProps> = (props) => {
  const { blockCard } = props

  return (
    <Content
      contentType={blockCard.type}
      contentProps={{
        viewMode: 'nav_item',
        readOnly: true,
        content: blockCard.content,
        messageBus: {
          subscribe: () => { return },
          unsubscribe: () => { return }
        },
        onChange: () => { return },
        onReplace: () => { return },
        onInteractionStart: () => { return },
        onInteractionEnd: () => { return },
      }} />
  )
}

interface Props {
  state: State3
  onExpand: (blockCardId: string) => void
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

const s2lStateEnum = {
  idle: Symbol('idle'),
  linking: Symbol('linking')
}

export const Search: React.FunctionComponent<Props> = (props) => {
  const { messenger } = props
  const searchRef = React.useRef<HTMLDivElement>()
  const getSearchRect = () => {
    return searchRef.current.getBoundingClientRect()
  }
  const [text, setText] = React.useState('')
  const [minimized, setMinimized] = React.useState(true)

  /** Search-to-Link */
  const [s2lState, setS2lState] = React.useState(s2lStateEnum.idle)
  const [s2lBlock, setS2lBlock] = React.useState<S2LBlock>({ valid: false })
  const [s2lStart, setS2lStart] = React.useState<Vec2>({ x: 0, y: 0 })
  const [s2lDelta, setS2lDelta] = React.useState<Vec2>({ x: 0, y: 0 })
  const handleDragStart = (e: UnifiedEventInfo) => {
    if (s2lState === s2lStateEnum.idle && s2lBlock.valid) {
      setMinimized(true)
      setS2lState(s2lStateEnum.linking)
      setS2lStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleDragging = (e: UnifiedEventInfo) => {
    if (s2lState === s2lStateEnum.linking) {
      setS2lDelta({ x: e.clientX - s2lStart.x, y: e.clientY - s2lStart.y })
    }
  }

  const handleDragEnd = (e: UnifiedEventInfo) => {
    if (s2lState === s2lStateEnum.linking) {
      setS2lStart({ x: 0, y: 0 })
      setS2lDelta({ x: 0, y: 0 })
      if (s2lBlock.valid) {
        console.log(s2lBlock, s2lDelta)
        props.onRequestLink({
          id: s2lBlock.id,
          position: {
            x: s2lBlock.rect.left + s2lDelta.x,
            // HACK: The rect is relative to viewport, but there's Navbar's 50px
            y: s2lBlock.rect.top + s2lDelta.y - 50
          }
        })
      }
      else
        console.log('s2lBlock is invalid')
      setS2lBlock({ valid: false })
      setS2lState(s2lStateEnum.idle)
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
    <div className="Search" ref={searchRef}
      onFocus={() => { setMinimized(false) }}>
      <style jsx>{`
        .Search {
          width: 300px;
          background: #fff;
          border-radius: .5rem;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
          cursor: ${s2lState === s2lStateEnum.linking ? 'grabbing' : 'auto'}
        }

        .SearchInput {
          padding: .5rem;
        }

        .SearchInput > input {
          outline: none;
          border: none;
        }

        .SearchResult {
          padding: 0 .5rem 0;
        }

        .ScrollList {
          height: 100%;
          max-height: 500px;
          overflow: auto;
        }

        .ScrollListItem {
          max-height: 200px;
          overflow: hidden;
          margin: 0 .3rem;
          border-radius: .5rem;
          transition: background 0.1s;
        }

        .ScrollListItem:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .ScrollListItem:first-of-type {
          margin-top: .5rem;
        }

        .ScrollListItem:last-of-type {
          margin-bottom: .5rem;
        }

        .S2LRelativeElem {
          position: absolute;
        }

        .VisualCopy {
          width: 300px;
          max-height: 200px;
          overflow: hidden;
          border-radius: .5rem;
          background: #fff;
          position: absolute;
          z-index: 999;
        }   

        hr {
          border: 1px solid #ddd;
          margin-right: .5rem;
          margin-left: .5rem;
        }

        hr:last-of-type {
          display: none;
        }
      `}</style>
      {
        !minimized ?
          <div className="SearchResult">
            <div className="ScrollList">
              {
                text ? Object.values(props.state.blockCardMap)
                  .filter(blockCard => {
                    /**
                     * HACK: Each content type should be able to decide 
                     * how to search its content!
                     */
                    return JSON.stringify(blockCard.content)
                      .toLocaleLowerCase().includes(text.toLocaleLowerCase())
                  })
                  .map(blockCard => {
                    return <React.Fragment key={blockCard.id}>
                      {
                        function () {
                          switch (s2lState) {
                            case s2lStateEnum.idle: {
                              /** The following doesn't support touch. */
                              return <div className="ScrollListItem"
                                onMouseEnter={(e) => {
                                  setS2lBlock({
                                    valid: true,
                                    id: blockCard.id,
                                    rect: e.currentTarget.getBoundingClientRect()
                                  })
                                }}
                                onMouseLeave={() => {
                                  setS2lBlock({ valid: false })
                                }}
                                onMouseUp={() => {
                                  props.onExpand(blockCard.id)
                                }}>
                                <SearchItemContent blockCard={blockCard} />
                              </div>
                            }
                            case s2lStateEnum.linking: {
                              return <div className="ScrollListItem">
                                <SearchItemContent blockCard={blockCard} />
                              </div>
                            }
                          }
                        }()
                      }
                      <hr />
                    </React.Fragment>
                  }) :
                  <></>
              }
            </div>
          </div> :
          <></>
      }
      <div className="SearchInput">
        <input placeholder="Search here..."
          onChange={(e) => { setText(e.target.value) }} />
      </div>
      {
        function () {
          console.log(s2lState)
          if (s2lState === s2lStateEnum.linking && s2lBlock.valid) {
            const blockCard = props.state.blockCardMap[s2lBlock.id]
            const searchRect = getSearchRect()
            return <div className="S2LRelativeElem" style={{
              top: s2lBlock.valid ? s2lBlock.rect.top - searchRect.top : 0,
              left: s2lBlock.valid ? s2lBlock.rect.left - searchRect.left : 0
            }}>
              <div className="VisualCopy"
                style={{
                  top: s2lDelta.y, left: s2lDelta.x
                }}>
                <SearchItemContent blockCard={blockCard} />
              </div>
            </div>
          }
        }()
      }
    </div>
  )
}