import * as React from 'react'
import { ContentProps, InitializedContent } from '../interfaces'
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

interface PMTextContent extends InitializedContent {
  data: {
    [key: string]: any
  }
}

interface State {
  PMState: EditorState
  isNewText: boolean
}

export const PMText: React.FunctionComponent<ContentProps<PMTextContent>> = (props) => {
  const PMRef = React.useRef<HTMLDivElement>()

  const createPMState = (props: ContentProps<PMTextContent>) => {
    return EditorState.create({
      schema,
      doc: props.content.initialized
        ? Node.fromJSON(schema, props.content.data) : undefined
    })
  }

  const createPMView = (props: ContentProps<PMTextContent>, PMState: EditorState) => {
    const view = new EditorView(PMRef.current, {
      state: PMState,
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        props.onChange({
          initialized: true,
          data: newState.doc.toJSON()
        })
      },
      handleDOMEvents: {
        focus: () => {
          props.onInteractionStart()
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
            props.onInteractionEnd()
          }
          return false
        }
      },
      editable: () => { return !props.readOnly }
    })
    return view
  }

  const [PMState, setPMState] = React.useState(createPMState(props))
  const [PMView, setPMView] = React.useState<EditorView | undefined>(undefined)
  const [isNewText, setIsNewText] = React.useState(!props.content.initialized)

  /** Create an editor when the component mounts. */
  React.useLayoutEffect(() => {
    const view = createPMView(props, PMState)
    if (isNewText) {
      view.focus()
      setIsNewText(false)
    }
    setPMView(view)
  }, [])

  /**
   * Update the content of the editor when props change.
   * Ignore the editor that is currently producing the changes.
   */
  React.useEffect(() => {
    /** Create a clean state. */
    const cleanPMState = createPMState(props)
    /** Update the doc part of the existing state. */
    PMState.doc = cleanPMState.doc
    /** Update the view if it exists and is not editing (hasFocus). */
    if (PMView && !PMView.hasFocus()) PMView.updateState(PMState)
  }, [props.content])

  const PMTextEditor = <>
    <style jsx global>{`
          .ProseMirror:focus {
            outline: none;
          }

          .ProseMirror {
            white-space: pre-wrap;
          }
        `}</style>
    <div ref={PMRef}></div>
  </>

  switch (props.viewMode) {
    case 'nav_item':
      return (
        <>
          <style jsx>{`
              div {
                font-size: 0.8rem;
                padding: 0.5rem;
                max-height: 100%;
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
      return <span>Unknown <code>viewMode</code>: {props.viewMode}</span>
  }
}

export class PMTextOld extends React.Component<ContentProps<PMTextContent>, State> {
  PMRef: React.RefObject<HTMLDivElement>

  constructor(props: ContentProps<PMTextContent>) {
    super(props)
    this.state = {
      PMState: EditorState.create({
        schema,
        doc: props.content.initialized
          ? Node.fromJSON(schema, props.content.data) : undefined
      }),
      isNewText: !props.content.initialized
    }
    this.PMRef = React.createRef()
  }

  componentDidMount(): void {
    const view = new EditorView(this.PMRef.current, {
      state: this.state.PMState,
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        this.props.onChange({
          initialized: true,
          data: newState.doc.toJSON()
        })
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