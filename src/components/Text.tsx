import * as React from 'react'
import { SlateTextEditor } from './SlateTextEditor'
import * as Slate from 'slate'
import { BlockContentProps } from '../interfaces'

/**
 * Slate CJK bugs
 * https://github.com/ianstormtaylor/slate/issues/3882
 * https://github.com/ianstormtaylor/slate/issues/3607
 * https://github.com/ianstormtaylor/slate/issues/3292
 */

interface State {
  content: Slate.Element[]
  isNewText: boolean
}

export class Text extends React.Component<BlockContentProps<unknown>, State> {
  constructor(props: BlockContentProps<unknown>) {
    super(props)

    const initialContent = [{ type: 'paragraph', children: [{ text: '' }] }]
    this.state = {
      content: Slate.Element.isElementList(props.content)
        ? props.content[0]
          ? Slate.Text.isTextList(props.content[0].children)
            ? props.content
            : initialContent
          : initialContent
        : initialContent,
      isNewText: props.content === null
    }
  }

  onChange = (content: Slate.Element[]): void => {
    this.setState({ content, isNewText: false })
    this.props.onChange(content)
  }

  render(): JSX.Element {
    const slateTextEditor = <SlateTextEditor
      readOnly={this.props.readOnly}
      // Cannot type Japanese in programmatically focused editor when the text block is newly created.
      forceFocus={this.state.isNewText}
      content={this.state.content}
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
            slateTextEditor :
            <div className="Title">{slateTextEditor}</div>
        }
      </>
    )
  }
}