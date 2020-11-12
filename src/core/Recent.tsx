import * as React from 'react'
import { Content } from '../content/Content'
import { ContentProps, State3 } from '../interfaces'
import { IPubSub } from '../lib/pubsub'

interface Props {
  /** A ring buffer. */
  history: string[]
  /** The size of the ring buffer. */
  historySize: number
  /** Index of the latest added. */
  current: number
  state: State3
  messageBus: IPubSub
  onExpand: (blockCardId: string) => void
}

export const Recent: React.FunctionComponent<Props> = (props) => {
  return (
    <div className="ToolBox Recent">
      <style jsx>{`
        button {
          border: none;
          background: unset;
        }

        button:focus {
          outline: none;
        }

        .Recent {
          width: 500px;
          height: 50px;
          display: flex;
          overflow-x: auto;
        }

        .RecentBtn {
          flex: 1 0 75px;
          max-width: 300px;
          height: 100%;
          overflow-y: hidden;
          transition: background 0.2s, flex-basis 0.3s;
        }

        .RecentBtn:hover {
          background: rgba(0, 0, 0, 0.1);
          flex: 1 0 200px;
        }

        .RecentBtn:active {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {
        function () {
          const historyToShow: string[] = []
          const maxNumToShow = 5

          for (let i = props.current - 1 + props.historySize; i > props.current; i--) {
            const blockCardId = props.history[i % props.historySize]
            /** Ignore when history is unpopulated. */
            if (!blockCardId) continue
            /** Count once for repeated visits. */
            if (typeof historyToShow.find(id => id === blockCardId) === 'undefined') {
              historyToShow.push(blockCardId)
              if (historyToShow.length >= maxNumToShow) break
            }
          }

          return historyToShow.map(blockCardId => {
            const blockCard = props.state.blockCardMap[blockCardId]
            const contentProps: ContentProps<unknown> = {
              viewMode: 'nav_item',
              readOnly: true,
              content: blockCard.content,
              messageBus: {
                subscribe: props.messageBus.subscribe,
                unsubscribe: props.messageBus.unsubscribe
              },
              onChange: () => { return },
              onReplace: () => { return },
              onInteractionStart: () => { return },
              onInteractionEnd: () => { return },
            }
            return (
              <button
                className="RecentBtn"
                onClick={() => { props.onExpand(blockCardId) }}
                key={blockCardId}>
                <Content
                  contentType={blockCard.type}
                  contentProps={contentProps}
                  key={blockCard.id} />
              </button>
            )
          })
        }()
      }
    </div>
  )
}