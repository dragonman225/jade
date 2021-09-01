import '@dragonman225/prosemirror-math/style/math.css'
import 'katex/dist/katex.min.css'

import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { classes } from 'typestyle'
import { AllSelection, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { MarkType } from 'prosemirror-model'
import { history } from 'prosemirror-history'
import { mathPlugin } from '@dragonman225/prosemirror-math'

import { styles } from './index.styles'
import { TextActionMenu } from './TextActionMenu'
import { schema } from './schema'
import {
  getActiveMarks,
  getProseMirrorDoc,
  inputRulesPlugin,
  isBoldActive,
  isCodeActive,
  isItalicActive,
  isProseMirrorDocEmpty,
  isStrikeActive,
  isUnderlineActive,
  keymapPlugin,
  MarkActiveMap,
  toggleMarkOnSelection,
  turnIntoMath,
} from './utils'
import { disableFocusAndPasteWithMouseMiddleButton } from './disableFocusAndPasteWithMouseMiddleButton'
import { observeInlineSelection } from './observeInlineSelection'
import { observeKeyword } from './observeKeyword'
import { getUnifiedClientCoords, isPointInRect } from '../../core/utils'
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
  const {
    factoryRegistry,
    concept,
    readOnly,
    onChange,
    onReplace,
    onInteractionStart,
    onInteractionEnd,
  } = props

  /** ProseMirror. */
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [editorMounted, setEditorMounted] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorView = useRef<EditorView>(null)

  /** Text Action Menu. */
  const textActionMenuRef = useRef<HTMLDivElement>(null)
  const [showTextActionMenu, setShowTextActionMenu] = useState(false)
  const [textActionMenuPos, setTextActionMenuPos] = useState({
    top: 0,
    left: 0,
  })
  const [markActiveMap, setMarkActiveMap] = useState<MarkActiveMap>(new Map())
  const boldActive = isBoldActive(markActiveMap)
  const italicActive = isItalicActive(markActiveMap)
  const strikeActive = isStrikeActive(markActiveMap)
  const underlineActive = isUnderlineActive(markActiveMap)
  const codeActive = isCodeActive(markActiveMap)
  const createToggleMark = (markType: MarkType) => () => {
    editorView.current.focus()
    toggleMarkOnSelection(
      editorView.current,
      editorView.current.state.selection,
      markActiveMap,
      markType
    )
  }
  const toggleBold = createToggleMark(schema.marks.bold)
  const toggleItalic = createToggleMark(schema.marks.italic)
  const toggleStrike = createToggleMark(schema.marks.strike)
  const toggleUnderline = createToggleMark(schema.marks.underline)
  const toggleCode = createToggleMark(schema.marks.code)

  /** Slash Menu. */
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPos, setSlashMenuPos] = useState<Vec2>({ x: 0, y: 0 })
  const [slashMenuChosenItemIndex, setSlashMenuChosenItemIndex] = useState(0)
  const slashMenuItems = useMemo(
    () =>
      factoryRegistry
        .getContentFactories()
        .map(f => ({ name: f.name, type: f.id })),
    [factoryRegistry]
  )

  const onKeyDown = React.useCallback(
    (_view: EditorView, event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        /**
         * Use keydown here so that we can preventDefault(), on keyup, default
         * actions would already happen.
         */
        if (showSlashMenu) {
          event.preventDefault()
          setSlashMenuChosenItemIndex(index => (index > 0 ? index - 1 : index))
        }
      } else if (event.key === 'ArrowDown') {
        if (showSlashMenu) {
          event.preventDefault()
          setSlashMenuChosenItemIndex(index =>
            index < slashMenuItems.length - 1 ? index + 1 : index
          )
        }
      } else if (event.key === 'Enter') {
        if (showSlashMenu) {
          setShowSlashMenu(false)
          /** The "blur" event will not fire after replace, so we need to 
            signal interaction end here. */
          onInteractionEnd()
          onReplace(slashMenuItems[slashMenuChosenItemIndex].type)
        }
      } else {
        setShowSlashMenu(false)
      }
      return false
    },
    [
      // onInteractionEnd,
      // onReplace,
      showSlashMenu,
      slashMenuChosenItemIndex,
      slashMenuItems,
    ]
  )

  /**
   * HACK: At this time, this is the best solution to handle all kinds of
   * blur.
   */
  useEffect(() => {
    function handleMousedown(e: MouseEvent) {
      const editorViewRect = editorView.current.dom.getBoundingClientRect()
      const textActionMenuRect =
        textActionMenuRef.current &&
        textActionMenuRef.current.getBoundingClientRect()
      const mousedownCoords = getUnifiedClientCoords(e)
      const isInEditorView =
        editorViewRect && isPointInRect(mousedownCoords, editorViewRect)
      const isInTextActionMenu =
        textActionMenuRect && isPointInRect(mousedownCoords, textActionMenuRect)

      if (
        /**
         * Only check when there's focus inside `EditorView` (including
         * nested `EditorView`s), to prevent unnecessary setState.
         */
        editorView.current.dom.contains(document.activeElement) &&
        !isInEditorView &&
        !isInTextActionMenu
      ) {
        console.log('PMText: interaction end via mousedown')
        setShowTextActionMenu(false)
        setShowSlashMenu(false)
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
    }

    window.addEventListener('mousedown', handleMousedown)

    return () => window.removeEventListener('mousedown', handleMousedown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function createEditorView(
    containerEl: HTMLElement,
    editorState: EditorState
  ) {
    const view = new EditorView(containerEl, {
      state: editorState,
      dispatchTransaction: transaction => {
        const newState = view.state.apply(transaction)
        view.updateState(newState)

        setShowPlaceholder(isProseMirrorDocEmpty(newState.doc))
        setMarkActiveMap(getActiveMarks(view.state.selection))

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
        focusin: () => {
          console.log('PMText: interaction start via focusin')
          onInteractionStart()
          return false
        },
        keydown: onKeyDown,
      },
      editable: () => !readOnly,
      /** Disable scroll-to-selection by lying that we do it in a custom way. */
      handleScrollToSelection: () => true,
    })
    return view
  }

  /** Init the ProseMirror editor when the component mounts. */
  useEffect(() => {
    // console.log('PMText: mount')
    const jsonDoc = concept.summary.data.data
    const state = EditorState.create({
      schema,
      doc: getProseMirrorDoc(jsonDoc, schema),
      plugins: [
        keymapPlugin,
        inputRulesPlugin,
        history(),
        disableFocusAndPasteWithMouseMiddleButton(),
        observeInlineSelection({
          onSelectionCreate: e => {
            setTextActionMenuPos({
              top: e.selectionBoundingRect.top - 50,
              left: e.selectionBoundingRect.left - 20,
            })
            setShowTextActionMenu(true)
          },
          onSelectionRemove: () => {
            setShowTextActionMenu(false)
          },
        }),
        observeKeyword({
          debug: true,
          rules: [
            {
              trigger: /\/$/,
              onTrigger: e => {
                console.log(e)
                setShowSlashMenu(true)
                setSlashMenuPos({
                  x: e.keywordCoords.from.right,
                  y: e.keywordCoords.from.bottom,
                })
              },
              onKeywordChange: console.log,
              onKeywordStop: console.log,
            },
          ],
        }),
        mathPlugin,
      ],
    })
    const view = createEditorView(editorContainerRef.current, state)

    /** Auto-focusing newly created text block. */
    if (!concept.summary.data.initialized) {
      view.focus()
      onChange({ initialized: true })
    }

    editorView.current = view

    setShowPlaceholder(isProseMirrorDocEmpty(state.doc))
    setEditorMounted(true)

    return () => {
      view.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Since ProseMirror's view is not managed by React, when it uses
   * variables that are React state, we need to update it on state change. */
  useEffect(() => {
    if (!editorMounted) return

    // console.log('PMText: update handleDOMEvents')

    editorView.current.props.handleDOMEvents.keydown = onKeyDown
  }, [onKeyDown, editorMounted])

  /**
   * Update content of the editor when props change.
   *
   * TODO: Do not rely on props change, build proper observer patterns.
   */
  useEffect(() => {
    if (!editorMounted) return

    // console.log('PMText: update content')

    const view = editorView.current
    const state = view.state

    /**
     * Ignore the editor that is currently producing changes.
     *
     * Note that simply checking `view.hasFocus()` doesn't work if there're
     * nested `EditorView`s introduced by `NodeView`s. Instead, we check if
     * the DOM of the root view contains a focused (editing) element. Not
     * vert accurate in theory, but works for now.
     */
    if (view.dom.contains(document.activeElement)) return

    const jsonDoc = concept.summary.data.data
    const doc = getProseMirrorDoc(jsonDoc, schema)
    const { from, to } = new AllSelection(state.doc)

    /** Block cases that cause replaceRangeWith() crash. */
    if (!doc || (!from && !to && isProseMirrorDocEmpty(doc))) return

    /**
     * setMeta() so that dispatchTransaction() in EditorView can know not
     * to call onChange(), preventing infinite loop.
     */
    view.dispatch(
      state.tr.replaceRangeWith(from, to, doc).setMeta('from_upstream', true)
    )
  }, [concept.summary.data.data, editorMounted])

  /**
   * Update "editable" prop of the editor view.
   */
  useEffect(() => {
    if (!editorMounted) return

    // console.log('PMText: update readOnly')

    editorView.current.setProps({ editable: () => !readOnly })
  }, [readOnly, editorMounted])

  const editorContainer = (
    <div ref={editorContainerRef} className={styles.EditorContainer}>
      {showPlaceholder && (
        <div className={styles.Placeholder}>Type &#39;/&#39; for commands</div>
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
          {showSlashMenu ? (
            props.createOverlay(
              <div
                className={styles.SlashMenu}
                style={{
                  top: slashMenuPos.y + 5,
                  left: slashMenuPos.x,
                }}>
                <p>BLOCKS</p>
                {slashMenuItems.map((item, index) => (
                  <div
                    className={classes(
                      styles.SlashMenuItem,
                      index === slashMenuChosenItemIndex
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
          {showTextActionMenu &&
            props.createOverlay(
              <div style={{ position: 'absolute', ...textActionMenuPos }}>
                <TextActionMenu
                  ref={textActionMenuRef}
                  boldActive={boldActive}
                  italicActive={italicActive}
                  strikeActive={strikeActive}
                  underlineActive={underlineActive}
                  codeActive={codeActive}
                  toggleBold={toggleBold}
                  toggleItalic={toggleItalic}
                  toggleStrike={toggleStrike}
                  toggleUnderline={toggleUnderline}
                  toggleCode={toggleCode}
                  turnIntoMath={() => {
                    turnIntoMath(
                      editorView.current,
                      editorView.current.state.selection
                    )
                    editorView.current.focus()
                    setShowTextActionMenu(false)
                  }}
                />
              </div>
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
