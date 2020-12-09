import * as React from 'react'
import { style } from 'typestyle'
import { ContentProps } from '../core/interfaces'
import { InitializedConceptData } from '../core/interfaces/concept'
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

interface PMTextContent extends InitializedConceptData {
  data: {
    [key: string]: any
  }
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
      editable: () => !props.readOnly
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

  /**
   * Update editable of prosemirror view when props change.
   */
  React.useEffect(() => {
    if (PMView) {
      PMView.setProps({ editable: () => !props.readOnly })
    }
  }, [props.readOnly])

  const PMTextEditorClassName = style({
    $debugName: 'PMTextEditor',
    $nest: {
      '& .ProseMirror': {
        whiteSpace: 'pre-wrap'
      },
      '& .ProseMirror:focus': {
        outline: 'none'
      }
    }
  })
  const PMTextEditor = <div ref={PMRef} className={PMTextEditorClassName}></div>

  switch (props.viewMode) {
    case 'NavItem': {
      const className = style({
        fontSize: '.8rem',
        padding: '.5rem',
        maxHeight: '100%'
      })
      return <div className={className}>{PMTextEditor}</div>
    }
    case 'Block': {
      const className = style({
        padding: '0.5rem 1.5rem'
      })
      return <div className={className}>{PMTextEditor}</div>
    }
    case 'CardTitle': {
      const className = style({
        fontSize: '1.2rem',
        fontWeight: 'bold',
        padding: '.5rem',
        overflow: 'auto',
        width: '100%'
      })
      return <div className={className}>{PMTextEditor}</div>
    }
    default:
      return <span>Unknown <code>viewMode</code>: {props.viewMode}</span>
  }
}