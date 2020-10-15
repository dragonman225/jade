import * as React from 'react'
import { BlockContentProps } from '../interfaces'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, Node } from 'prosemirror-model'

/**
 * Problems of ProseMirror:
 * Imperative coding style.
 * Less intuitive concepts.
 * No TypeScript support.
 * CSS is outside of React. Cannot use styled-jsx or other modern tools.
 */

const schema = new Schema({
  nodes: {
    doc: { content: 'text*' },
    text: { inline: true }
  }
})

interface State {
  PMState: EditorState
  isNewText: boolean
}

export class PMText extends React.Component<BlockContentProps<unknown>, State> {
  PMRef: React.RefObject<HTMLDivElement>

  constructor(props: BlockContentProps<unknown>) {
    super(props)
    this.state = {
      PMState: EditorState.create({
        schema,
        doc: (props.content !== null)
          ? Node.fromJSON(schema, props.content) : undefined
      }),
      isNewText: props.content === null
    }
    this.PMRef = React.createRef()
  }

  componentDidMount(): void {
    const view = new EditorView(this.PMRef.current, {
      state: this.state.PMState,
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        this.props.onChange(newState.doc.toJSON())
      },
      handleDOMEvents: {
        focus: () => {
          this.props.onInteractionStart()
          return false
        },
        blur: (_view, event) => {
          if (event.target !== document.activeElement) {
            this.props.onInteractionEnd()
          }
          return false
        }
      },
      editable: () => { return !this.props.readOnly }
    })

    if (this.state.isNewText) {
      view.focus()
      this.setState({ isNewText: false })
    }
  }

  render(): JSX.Element {
    const PMTextEditor =
      <>
        <style jsx global>{`
          .ProseMirror:focus {
            outline: none;
          }

          .ProseMirror {
            white-space: pre-wrap;
          }
        `}</style>
        <div ref={this.PMRef}></div>
      </>
    switch (this.props.viewMode) {
      case 'block':
        return (
          <>
            <style jsx>{`
              .Block {
                padding: 0.3rem 1.5rem;
              }
            `}</style>
            <div className="Block">{PMTextEditor}</div>
          </>
        )
      case 'card':
        return (
          <>
            <style jsx>{`
              .CardTitle {
                padding: 0;
                font-size: 1.2rem;
                font-weight: bold;
                min-width: 100px;
              }
            `}</style>
            <div className="CardTitle">{PMTextEditor}</div>
          </>
        )
      default:
        return <p>Unknown <code>viewMode</code>: {this.props.viewMode}</p>
    }
  }
}