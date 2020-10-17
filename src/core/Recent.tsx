import * as React from 'react'
import { Text } from '../content/Text'
import { Image } from '../content/Image'
import { PMText } from '../content/PMText'
import { BlockContentProps, State3 } from '../interfaces'

interface Props {
  /** A ring buffer. */
  history: string[]
  /** The size of the ring buffer. */
  historySize: number
  /** Index of the latest added. */
  current: number
  state: State3
  onExpand: (blockCardId: string) => void
}

export const Recent: React.FunctionComponent<Props> = (props) => {
  return (
    <div className="Recent">
      <style jsx>{`
        button {
          border: none;
          background: unset;
        }

        button:focus {
          outline: none;
        }

        .Recent {
          height: 50px;
          display: flex;
          overflow-x: auto;
        }

        .RecentBtn {
          flex: 1 0 100px;
          max-width: 300px;
          height: 100%;
          overflow-y: hidden;
          transition: background 0.2s;
        }

        .RecentBtn:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .RecentBtn:active {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {
        function () {
          const historyToShow: string[] = []

          for (let i = props.current - 1 + props.historySize; i > props.current; i--) {
            const blockCardId = props.history[i % props.historySize]
            /** Ignore when history is unpopulated. */
            if (!blockCardId) continue
            /** Count once for repeated visits. */
            if (typeof historyToShow.find(id => id === blockCardId) === 'undefined') {
              historyToShow.push(blockCardId)
            }
          }

          return historyToShow.map(blockCardId => {
            const blockCard = props.state.blockCardMap[blockCardId]
            const contentProps: BlockContentProps<unknown> = {
              viewMode: 'nav_item',
              readOnly: true,
              content: blockCard.content,
              onChange: () => { return },
              onInteractionStart: () => { return },
              onInteractionEnd: () => { return },
            }
            const content = function () {
              switch (blockCard.type) {
                case 'text':
                  return <Text {...contentProps} />
                case 'pmtext':
                  return <PMText {...contentProps} />
                case 'image':
                  return <Image {...contentProps} />
                default:
                  return <span>{blockCard.type}</span>
              }
            }()
            return <button
              className="RecentBtn"
              onClick={() => { props.onExpand(blockCardId) }}
              key={blockCardId}>{content}</button>
          })
        }()
      }
    </div>
  )
}