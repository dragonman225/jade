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
    this.state = {
      content: this.getValidContent(props.content),
      isNewText: props.content === null
    }
  }

  getValidContent(content: unknown): Slate.Element[] {
    const initialContent = [{ type: 'paragraph', children: [{ text: '' }] }]
    return Slate.Element.isElementList(content)
      ? content[0]
        ? Slate.Text.isTextList(content[0].children)
          ? content
          : initialContent
        : initialContent
      : initialContent
  }

  // HACK: Detect props.content change from other BlockCard refs on the same view, using non-deprecated API.
  componentDidUpdate(): void {
    if (this.props.content && JSON.stringify(this.state.content) !== JSON.stringify(this.props.content)) {
      this.setState({
        content: this.getValidContent(this.props.content)
      })
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

    switch (this.props.viewMode) {
      case 'nav_item':
        return (
          <>
            <style jsx>{`
              div {
                font-size: 0.8rem;
                padding: 0.5rem;
                max-height: 100%;
                overflow: hidden;
              }
            `}</style>
            <div>{slateTextEditor}</div>
          </>
        )
      case 'block':
        return (
          <>
            <style jsx>{`
              .Block {
                padding: 0.5rem 1.5rem;
              }
            `}</style>
            <div className="Block">{slateTextEditor}</div>
          </>
        )
      case 'card':
        return (
          <>
            <style jsx>{`
              .CardTitle {
                padding-top: 0.5rem;
                font-size: 1.2rem;
                font-weight: bold;
                min-width: 100px;
              }
            `}</style>
            <div className="CardTitle">{slateTextEditor}</div>
          </>
        )
      default:
        return <span>Unknown <code>viewMode</code>: {this.props.viewMode}</span>
    }
  }
}