import * as React from 'react'
import * as typestyle from 'typestyle'
import { Content } from '.'
import { ContentProps } from '../core/interfaces'
import { InitializedConceptData } from '../core/interfaces/concept'

type Props = ContentProps<undefined>

const styles = {
  Recent: typestyle.style({
    height: 50,
    display: 'flex',
    padding: '0px 22px',
  }),
}

export const RecentTool: React.FunctionComponent<Props> = props => {
  const { app, database, messageBus, physicalInfo } = props
  return (
    <div className={styles.Recent} style={{ width: physicalInfo.width }}>
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
          background: var(--bg-hover);
          /* flex: 1 0 200px; */
          overflow-y: scroll;
          padding-right: 0;
        }

        .RecentBtn:active {
          background: var(--bg-hover);
        }
      `}</style>
      {(function () {
        const historyToShow: string[] = []
        const maxNumToShow = Math.floor(physicalInfo.width / 100)

        for (let i = app.state.expandHistory.length - 2; i >= 0; i--) {
          const conceptId = app.state.expandHistory[i]

          /** Ignore if the slot is unpopulated. */
          if (!conceptId) continue

          /** Ignore repeated visits. */
          if (!historyToShow.find(id => id === conceptId)) {
            historyToShow.push(conceptId)
            if (historyToShow.length >= maxNumToShow) break
          }
        }

        return historyToShow.map(conceptId => {
          const concept = database.getConcept(conceptId)
          const contentProps: ContentProps<InitializedConceptData> = {
            viewMode: 'NavItem',
            readOnly: true,
            content: concept.summary.data,
            messageBus,
            app,
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
          }
          return (
            <button
              className="RecentBtn"
              onClick={() => {
                app.dispatch({
                  type: 'navigation::expand',
                  data: { id: conceptId },
                })
              }}
              key={conceptId}>
              <Content
                contentType={concept.summary.type}
                contentProps={contentProps}
                key={concept.id}
              />
            </button>
          )
        })
      })()}
    </div>
  )
}
