import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { classes, stylesheet } from 'typestyle'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, Node } from 'prosemirror-model'
import { getCaretCoordinates } from '../../core/lib/utils'
import {
  ConceptDisplayProps,
  Vec2,
  InitializedConceptData,
  Factory,
} from '../../core/interfaces'

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
    text: { inline: true },
  },
})

interface PMTextContent extends InitializedConceptData {
  data: {
    [key: string]: any
  }
}

type Props = ConceptDisplayProps<PMTextContent>

const styles = stylesheet({
  EditorContainer: {
    /** For Placeholder to reference position. */
    position: 'relative',
    $nest: {
      '& .ProseMirror': {
        whiteSpace: 'pre-wrap',
      },
      '& .ProseMirror:focus': {
        outline: 'none',
      },
    },
  },
  PMTextNavItem: {
    fontSize: '.8rem',
    padding: '.5rem',
    maxHeight: '100%',
  },
  PMTextBlock: {
    padding: '0.5rem 1.5rem',
  },
  PMTextCardTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    padding: '.3rem .5rem',
    /** auto vertical center when it is smaller than HeaderTool's content 
        min-height. */
    margin: 'auto',
    overflow: 'auto',
    width: '100%',
  },
  SlashMenu: {
    width: 150,
    padding: '.3rem',
    position: 'absolute',
    zIndex: 10000,
    background: '#fff',
    boxShadow: 'var(--shadow-light)',
    borderRadius: 'var(--border-radius-small)',
    $nest: {
      '&>p': {
        margin: '.2rem .5rem .5rem',
        fontSize: '.7rem',
        opacity: 0.7,
      },
    },
  },
  SlashMenuItem: {
    padding: '.3rem .5rem',
    borderRadius: 'var(--border-radius-small)',
  },
  'SlashMenuItem--Chosen': {
    background: 'var(--bg-hover)',
  },
  Placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7,
    pointerEvents: 'none',
  },
})

const PMText: React.FunctionComponent<Props> = props => {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<Vec2>({ x: 0, y: 0 })
  const [chosenItemIndex, setChosenItemIndex] = useState(0)
  const [isEmpty, setIsEmpty] = useState(true)
  const menuItems = props.factoryRegistry
    .getContentFactories()
    .map(f => ({ name: f.name, type: f.id }))

  function onKeyDown(_view: EditorView<any>, event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      /**
       * Use keydown here so that we can preventDefault(), on keyup, default
       * actions would already happen.
       */
      if (showMenu) {
        event.preventDefault()
        if (chosenItemIndex > 0) {
          setChosenItemIndex(chosenItemIndex - 1)
        }
      }
    } else if (event.key === 'ArrowDown') {
      if (showMenu) {
        event.preventDefault()
        if (chosenItemIndex < menuItems.length - 1) {
          setChosenItemIndex(chosenItemIndex + 1)
        }
      }
    } else if (event.key === 'Enter') {
      if (showMenu) {
        setShowMenu(false)
        /** The "blur" event will not fire after replace, so we need to 
            signal interaction end here. */
        props.onInteractionEnd()
        props.onReplace(menuItems[chosenItemIndex].type)
      }
    } else {
      setShowMenu(false)
    }
    return false
  }

  function onKeyUp(_view: EditorView<any>, event: KeyboardEvent) {
    if (event.key === '/') {
      /**
       * Get caret coordinates and show menu on keyup, since for keys that
       * modify content (visible chars, backspace), they do it "after"
       * keydown. So, to show menu at the right location, we need to get
       * caret coordinates after that, and keyup is a good place.
       */
      const s = window.getSelection()
      if (s && s.rangeCount > 0) {
        const r = s.getRangeAt(0)
        const caretCoord = getCaretCoordinates(r)
        setShowMenu(true)
        setMenuPos({ x: caretCoord.right, y: caretCoord.bottom })
      }
    }
    return false
  }

  function isDocEmpty(state: EditorState) {
    return state.doc.content.size === 0
  }

  function createEditorState(props: Props) {
    return EditorState.create({
      schema,
      doc: props.concept.summary.data.initialized
        ? Node.fromJSON(schema, props.concept.summary.data.data)
        : undefined,
    })
  }

  function createEditorView(
    props: Props,
    containerEl: HTMLElement,
    editorState: EditorState
  ) {
    const view = new EditorView(containerEl, {
      state: editorState,
      dispatchTransaction: transaction => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        if (isDocEmpty(newState)) {
          setIsEmpty(true)
        } else {
          setIsEmpty(false)
        }
        /** Submit changes only when the transaction modifies the doc. */
        if (transaction.steps.length > 0)
          props.onChange({
            initialized: true,
            data: newState.doc.toJSON(),
          })
      },
      handleDOMEvents: {
        focus: () => {
          console.log('pmtext: focus')
          props.onInteractionStart()
          return false
        },
        blur: (_view, event) => {
          console.log('pmtext: blur')
          setShowMenu(false)
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
        },
      },
      editable: () => !props.readOnly,
    })
    return view
  }

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorState = useRef<EditorState>(null)
  const editorView = useRef<EditorView>(null)
  const [isNewText, setIsNewText] = useState(
    !props.concept.summary.data.initialized
  )
  const [mounted, setMounted] = useState(false)

  /** Init the ProseMirror editor when the component mounts. */
  useEffect(() => {
    console.log('pmtext: mount')
    const state = createEditorState(props)
    const view = createEditorView(props, editorContainerRef.current, state)
    view.props.handleDOMEvents.keydown = onKeyDown
    view.props.handleDOMEvents.keyup = onKeyUp
    if (isNewText) {
      view.focus()
      setIsNewText(false)
    }
    if (!isDocEmpty(state)) {
      setIsEmpty(false)
    }
    editorState.current = state
    editorView.current = view
    setMounted(true)

    return () => {
      view.destroy()
    }
  }, [])

  /**
   * Since ProseMirror's view is not managed by React, when it uses
   * variables that are React state, we need to update it on state change. */
  useEffect(() => {
    if (mounted) {
      editorView.current.props.handleDOMEvents.keydown = onKeyDown
    }
  }, [showMenu, chosenItemIndex, isEmpty])

  /**
   * Update content of the editor when props change.
   */
  useEffect(() => {
    if (mounted) {
      console.log('pmtext: update content')
      /** Ignore the editor that is currently producing changes (hasFocus). */
      if (!editorView.current.hasFocus()) {
        /** Create a clean state. */
        const cleanEditorState = createEditorState(props)
        /** Update the doc part of the existing state. */
        editorState.current.doc = cleanEditorState.doc
        /** Update the view. */
        editorView.current.updateState(editorState.current)
      }
    }
  }, [props.concept.summary.data])

  /**
   * Update "editable" prop of the editor view.
   */
  useEffect(() => {
    if (mounted) {
      console.log('pmtext: update readOnly')
      editorView.current.setProps({ editable: () => !props.readOnly })
    }
  }, [props.readOnly])

  const editorContainer = (
    <div ref={editorContainerRef} className={styles.EditorContainer}>
      {isEmpty ? (
        <div className={styles.Placeholder}>Type &#39;/&#39; for commands</div>
      ) : (
        <></>
      )}
    </div>
  )

  switch (props.viewMode) {
    case 'NavItem': {
      return <div className={styles.PMTextNavItem}>{editorContainer}</div>
    }
    case 'Block': {
      return (
        <div className={styles.PMTextBlock}>
          {editorContainer}
          {showMenu ? (
            props.createOverlay(
              <div
                className={styles.SlashMenu}
                style={{
                  top: menuPos.y + 5,
                  left: menuPos.x,
                }}>
                <p>BLOCKS</p>
                {menuItems.map((item, index) => (
                  <div
                    className={classes(
                      styles.SlashMenuItem,
                      index === chosenItemIndex
                        ? styles['SlashMenuItem--Chosen']
                        : undefined
                    )}
                    key={item.name}>
                    {item.name}
                  </div>
                ))}
              </div>
            )
          ) : (
            <></>
          )}
        </div>
      )
    }
    case 'CardTitle': {
      return <div className={styles.PMTextCardTitle}>{editorContainer}</div>
    }
    default:
      return (
        <span>
          Unknown <code>viewMode</code>: {props.viewMode}
        </span>
      )
  }
}

export const PMTextFactory: Factory = {
  id: 'pmtext',
  name: 'PMText',
  component: PMText,
}
