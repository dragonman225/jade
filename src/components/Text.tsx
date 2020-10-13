import * as React from 'react'
import { MyEditor } from './Editor'
import { Node } from 'slate'
import { BlockContentProps } from '../interfaces'

export class Text extends React.Component<BlockContentProps> {
  constructor(props: BlockContentProps) {
    super(props)
  }

  render(): JSX.Element {
    const content: Node[] = this.props.content
      ? this.props.content as Node[]
      : [{ type: 'paragraph', children: [{ text: '' }] }]
    const myEditor = <MyEditor
      readOnly={this.props.readOnly}
      focus={!this.props.content}
      content={content}
      onChange={this.props.onChange}
      onFocus={this.props.onInteractionStart}
      onBlur={this.props.onInteractionEnd} />
    return (
      <>
        <style jsx>{`
          .Title {
            font-size: 1.2rem;
            font-weight: bold;
          }
        `}</style>
        {
          this.props.viewMode === 'block' ?
            myEditor :
            <div className="Title">{myEditor}</div>
        }
      </>
    )
  }
}