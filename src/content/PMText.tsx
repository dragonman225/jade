import * as React from 'react'
import { ContentProps } from '../interfaces'
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

export class PMText extends React.Component<ContentProps<unknown>, State> {
  PMRef: React.RefObject<HTMLDivElement>

  constructor(props: ContentProps<unknown>) {
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
            window.getSelection().removeAllRanges()
            /**
             * Below is not working. The old selection persists in the view 
             * until future focus, and the future focus shows the 
             * selection being set in setSelection() instead of 
             * responding to the intention of the mouse.
             */
            // const state = view.state
            // view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, 0)))
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
      case 'nav_item':
        return (
          <>
            <style jsx>{`
              div {
                font-size: 0.8rem;
                padding: 0.5rem;
                max-height: 100%;
                /*overflow: hidden;*/
              }
            `}</style>
            <div>{PMTextEditor}</div>
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
            <div className="Block">{PMTextEditor}</div>
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
            <div className="CardTitle">{PMTextEditor}</div>
          </>
        )
      default:
        return <span>Unknown <code>viewMode</code>: {this.props.viewMode}</span>
    }
  }
}