import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { classes } from 'typestyle'
import { AllSelection, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node } from 'prosemirror-model'

import { styles } from './index.styles'
import { schema } from './schema'
import { createEditorState, isDocEmpty } from './utils'
import { getCaretCoordinates } from '../../core/utils'
import { ConceptDisplayProps, Vec2, Factory } from '../../core/interfaces'

/**
 * Problems of ProseMirror:
 * Imperative coding style.
 * Less intuitive concepts.
 * No TypeScript support.
 * CSS is outside of React. Cannot use styled-jsx or other modern tools.
 */

interface PMTextContent {
  initialized?: boolean
  data?: {
    [key: string]: any
  }
}

type Props = ConceptDisplayProps<PMTextContent>

const PMText: React.FunctionComponent<Props> = props => {
  const { factoryRegistry } = props
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<Vec2>({ x: 0, y: 0 })
  const [chosenItemIndex, setChosenItemIndex] = useState(0)
  const [isEmpty, setIsEmpty] = useState(true)
  const menuItems = useMemo(
    () =>
      factoryRegistry
        .getContentFactories()
        .map(f => ({ name: f.name, type: f.id })),
    [factoryRegistry]
  )

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

  function createEditorView(
    props: Props,
    containerEl: HTMLElement,
    editorState: EditorState
  ) {
    const { onChange, onInteractionStart, onInteractionEnd, readOnly } = props
    const view = new EditorView(containerEl, {
      state: editorState,
      dispatchTransaction: transaction => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        setIsEmpty(isDocEmpty(newState))
        /**
         * Submit changes only when the transaction modifies the doc and
         * it comes from UI operations.
         */
        if (
          transaction.steps.length > 0 &&
          !transaction.getMeta('from_upstream')
        )
          onChange({
            initialized: true,
            data: newState.doc.toJSON(),
          })
      },
      handleDOMEvents: {
        focus: () => {
          // console.log('PMText: focus')
          onInteractionStart()
          return false
        },
        blur: (_view, event) => {
          // console.log('PMText: blur')
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
            onInteractionEnd()
          }
          return false
        },
      },
      editable: () => !readOnly,
      /** Disable scroll-to-selection by lying that we do it in a custom way. */
      handleScrollToSelection: () => true,
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
    // console.log('PMText: mount')
    const state = createEditorState(props.concept.summary.data.data)
    const view = createEditorView(props, editorContainerRef.current, state)
    view.props.handleDOMEvents.keydown = onKeyDown
    view.props.handleDOMEvents.keyup = onKeyUp
    if (isNewText) {
      view.focus()
      setIsNewText(false)
      props.onChange({ initialized: true })
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
  }, [showMenu, chosenItemIndex, isEmpty, mounted])

  /**
   * Update content of the editor when props change.
   *
   * TODO: Do not rely on props change, build proper observer patterns.
   */
  useEffect(() => {
    if (mounted) {
      // console.log('PMText: update content')

      /** Ignore the editor that is currently producing changes (hasFocus). */
      if (editorView.current.hasFocus()) return

      const jsonDoc = props.concept.summary.data.data
      const doc = jsonDoc ? Node.fromJSON(schema, jsonDoc) : undefined
      const state = editorView.current.state
      const { from, to } = new AllSelection(state.doc)

      /** Block cases that cause replaceRangeWith() crash. */
      if (!doc || (!from && !to && doc.content.size === 0)) return

      /**
       * setMeta() so that dispatchTransaction() in EditorView can know not
       * to call onChange(), preventing infinite loop.
       */
      editorView.current.dispatch(
        state.tr.replaceRangeWith(from, to, doc).setMeta('from_upstream', true)
      )
    }
  }, [props.concept.summary.data.data, mounted])

  /**
   * Update "editable" prop of the editor view.
   */
  useEffect(() => {
    if (mounted) {
      // console.log('PMText: update readOnly')
      editorView.current.setProps({ editable: () => !props.readOnly })
    }
  }, [props.readOnly, mounted])

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
