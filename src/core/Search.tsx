import * as React from 'react'
import { Content } from '../content/Content'
import { State3 } from '../interfaces'

interface Props {
  state: State3
  onExpand: (blockCardId: string) => void
}

export const Search: React.FunctionComponent<Props> = (props) => {
  const [text, setText] = React.useState('')

  return (
    <div className="Search">
      <style jsx>{`
        .Search {
          width: 300px;
          background: #fff;
          border-radius: .5rem;
          box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
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
          max-height: 500px;
          overflow: auto;
        }

        .ScrollListItem {
          max-height: 200px;
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

        hr {
          border: 1px solid #ddd;
          margin-right: .5rem;
          margin-left: .5rem;
        }

        hr:last-of-type {
          display: none;
        }
      `}</style>
      <div className="SearchResult">
        <div className="ScrollList">
          {
            text ? Object.values(props.state.blockCardMap)
              .filter(blockCard => {
                /**
                 * HACK: Each content type should be able to decide 
                 * how to search!
                 */
                return JSON.stringify(blockCard.content)
                  .toLocaleLowerCase().includes(text.toLocaleLowerCase())
              })
              .map(blockCard => {
                return <>
                  <div className="ScrollListItem"
                    onClick={() => { props.onExpand(blockCard.id) }}>
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
                      }}
                      key={blockCard.id} />
                  </div>
                  <hr />
                </>
              })
              : <></>
          }
        </div>
      </div>
      <div className="SearchInput">
        <input placeholder="Search here..."
          onChange={(e) => { setText(e.target.value) }} />
      </div>
    </div>
  )
}