import * as React from 'react'
import * as typestyle from 'typestyle'
import { Content } from '../content/Content'
import { ContentProps, State3 } from './interfaces'
import { InitializedConceptData } from './interfaces/concept'
import { IPubSub } from '../lib/pubsub'

interface Props {
  width: number
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

const styles = {
  Recent: typestyle.style({
    height: 50,
    display: 'flex',
    padding: '0px 22px'
  })
}

export const RecentTool: React.FunctionComponent<Props> = (props) => {
  return (
    <div className={styles.Recent} style={{ width: props.width }}>
      <style jsx>{`
        button {
          border: none;
          background: unset;
        }

        button:focus {
          outline: none;
        }

        .RecentBtn {
          flex: 1 0 75px;
          max-width: 300px;
          height: 100%;
          overflow: hidden;
          transition: background 0.2s, flex-basis 0.3s;
          padding: 0 5px;
        }

        .RecentBtn ::-webkit-scrollbar {
          width: 5px;
        }

        .RecentBtn ::-webkit-scrollbar-thumb {
          background: #888;
        }

        .Recent ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .RecentBtn:hover {
          background: rgba(0, 0, 0, 0.1);
          /* flex: 1 0 200px; */
          overflow-y: scroll;
          padding-right: 0;
        }

        .RecentBtn:active {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {
        function () {
          const historyToShow: string[] = []
          const maxNumToShow = Math.floor(props.width / 100)

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

          return historyToShow.map(conceptId => {
            const concept = props.state.conceptMap[conceptId]
            const contentProps: ContentProps<InitializedConceptData> = {
              viewMode: 'NavItem',
              readOnly: true,
              content: concept.summary.data,
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
                onClick={() => { props.onExpand(conceptId) }}
                key={conceptId}>
                <Content
                  contentType={concept.summary.type}
                  contentProps={contentProps}
                  key={concept.id} />
              </button>
            )
          })
        }()
      }
    </div>
  )
}