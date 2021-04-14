import * as React from 'react'
import { SlateTextEditor } from './SlateTextEditor'
import * as Slate from 'slate'
import { ContentProps } from '../core/interfaces'
import {
  InitializedConceptData,
  UninitializedConceptData,
} from '../core/interfaces/concept'

/**
 * Slate CJK bugs
 * https://github.com/ianstormtaylor/slate/issues/3882
 * https://github.com/ianstormtaylor/slate/issues/3607
 * https://github.com/ianstormtaylor/slate/issues/3292
 */

interface TextContent extends InitializedConceptData {
  data: Slate.Element[]
}

interface State {
  slateData: Slate.Element[]
  isNewText: boolean
  prevPropsContent: TextContent | UninitializedConceptData
}

export class Text extends React.Component<ContentProps<TextContent>, State> {
  constructor(props: ContentProps<TextContent>) {
    super(props)
    this.state = {
      slateData: this.getValidSlateData(props.content),
      isNewText: !props.content.initialized,
      prevPropsContent: props.content,
    }
  }

  getValidSlateData(
    content: TextContent | UninitializedConceptData
  ): Slate.Element[] {
    const initialContent = [{ type: 'paragraph', children: [{ text: '' }] }]
    return content.initialized ? content.data : initialContent
  }

  // HACK: Detect props.content change from other BlockCard refs on the same view, using non-deprecated API.
  // componentDidUpdate(): void {
  //   if (JSON.stringify(this.state.prevPropsContent) !== JSON.stringify(this.props.content)) {
  //     this.setState({
  //       slateData: this.getValidSlateData(this.props.content)
  //     })
  //   }
  // }

  onChange = (content: Slate.Element[]): void => {
    this.setState({ slateData: content, isNewText: false })
    this.props.onChange({ initialized: true, data: content })
  }

  render(): JSX.Element {
    const slateTextEditor = (
      <SlateTextEditor
        readOnly={this.props.readOnly}
        // Cannot type Japanese in programmatically focused editor when the text block is newly created.
        forceFocus={this.state.isNewText}
        content={this.state.slateData}
        onChange={this.onChange}
        onFocus={this.props.onInteractionStart}
        onBlur={this.props.onInteractionEnd}
      />
    )

    switch (this.props.viewMode) {
      case 'NavItem':
        return (
          <>
            <style jsx>{`
              div {
                font-size: 0.8rem;
                padding: 0.5rem;
                max-height: 100%;
                /* overflow: hidden; */
              }
            `}</style>
            <div>{slateTextEditor}</div>
          </>
        )
      case 'Block':
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
      case 'CardTitle':
        return (
          <>
            <style jsx>{`
              .CardTitle {
                font-size: 1.2rem;
                font-weight: bold;
                padding: 0.5rem;
                overflow: auto;
                width: 100%;
              }
            `}</style>
            <div className="CardTitle">{slateTextEditor}</div>
          </>
        )
      default:
        return (
          <span>
            Unknown <code>viewMode</code>: {this.props.viewMode}
          </span>
        )
    }
  }
}
