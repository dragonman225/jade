import * as React from 'react'
import { MyEditor } from './Editor'
import { Node } from 'slate'
import { BlockContentProps } from '../interfaces'

export class Text extends React.Component<BlockContentProps<Node[]>> {
  constructor(props: BlockContentProps<Node[]>) {
    super(props)
  }

  render(): JSX.Element {
    return (
      <MyEditor
        readOnly={this.props.readOnly}
        focus={!this.props.content}
        content={this.props.content ? this.props.content : [{ type: 'paragraph', children: [{ text: '' }] }]}
        onChange={this.props.onChange}
        onFocus={this.props.onInteractionStart}
        onBlur={this.props.onInteractionEnd} />
    )
  }
}