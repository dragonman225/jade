import '@dragonman225/prosemirror-math/style/math.css'
import 'katex/dist/katex.min.css'

import * as React from 'react'
import { useState, useEffect, useRef, useContext } from 'react'
import { AllSelection, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node as ProseNode } from 'prosemirror-model'
import { history } from 'prosemirror-history'
import { mathPlugin } from '@dragonman225/prosemirror-math'

import { styles } from './index.styles'
import { TextActionMenu } from './TextActionMenu/TextActionMenu'
import { useTextActionMenu } from './TextActionMenu/useTextActionMenu'
import { SuggestionMenu } from './SuggestionMenu/SuggestionMenu'
import {
  useSuggestionMenu,
  SuggestFor,
} from './SuggestionMenu/useSuggestionMenu'
import { observeKeyword } from './SuggestionMenu/observeKeyword'
import { schema } from './ProseMirrorSchema/schema'
import {
  getProseMirrorDoc,
  inputRulesPlugin,
  isProseMirrorDocEmpty,
  keymapPlugin,
} from './utils'
import { PMTextContent } from './types'
import { disablePasteWithMouseMiddleButton } from './ProseMirrorPlugins/disableFocusAndPasteWithMouseMiddleButton'
import { observeInlineSelection } from './TextActionMenu/observeInlineSelection'
import {
  handleMarkClick,
  MarkClickRule,
} from './ProseMirrorPlugins/handleMarkClick'
import { LinkMark, linkMarkName } from './ProseMirrorSchema/link'
import { getUnifiedClientCoords, isPointInRect } from '../../core/utils'
import {
  ConceptDisplayProps,
  Factory,
  PositionType,
  Rect,
  TypedConcept,
} from '../../core/interfaces'
import { Action, ConceptCreatePositionIntent } from '../../core/store/actions'
import { PlaceMenu } from '../../core/components/PlaceMenu'
import { SystemContext } from '../../core/store/systemContext'
import { getConceptIdFromUrl, isInternalUrl } from '../../core/utils/url'
import { useFunctionRef } from './useFunctionRef'

type Props = ConceptDisplayProps<PMTextContent>

const PMText: React.FunctionComponent<Props> = props => {
  const {
    database,
    factoryRegistry,
    concept,
    blockId,
    readOnly,
    onChange,
    onReplace,
    onInteractionStart,
    onInteractionEnd,
    dispatchAction,
  } = props
  const { openExternal } = useContext(SystemContext)

  /** ProseMirror. */
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const [editorMounted, setEditorMounted] = useState(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorView = useRef<EditorView>(null)

  /** Text Action Menu. */
  const {
    textActionMenuRef,
    showTextActionMenu,
    setShowTextActionMenu,
    textActionMenuPos,
    setTextActionMenuPos,
    boldActive,
    italicActive,
    strikeActive,
    underlineActive,
    codeActive,
    activeHighlightColor,
    activeLink,
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleUnderline,
    toggleCode,
    setHighlight,
    setLink,
    turnIntoLatex,
    updateMenuState,
  } = useTextActionMenu(editorView.current)

  /** Suggestion Menu. */
  const suggestionMenuRef = useRef<HTMLDivElement>(null)
  const {
    models: suggestionMenuModels,
    operations: suggestionMenuOperations,
  } = useSuggestionMenu(
    database,
    factoryRegistry,
    onInteractionEnd,
    onReplace,
    editorView.current
  )
  const { showSuggestionMenu, optionGroups, suggestFor } = suggestionMenuModels
  const {
    openSuggestionMenu,
    closeSuggestionMenu,
    updateSuggestionMenu,
    confirmOption,
  } = suggestionMenuOperations
  const [suggestionMenuAnchorRect, setSlashMenuAnchorRect] = useState<Rect>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })
  const onKeyDownRef = useFunctionRef<
    (_view: EditorView, event: KeyboardEvent) => boolean
  >()
  useEffect(() => {
    onKeyDownRef.current = (view: EditorView, event: KeyboardEvent) => {
      /** COMPAT: macOS. */
      if (view.composing) return false

      if (
        showSuggestionMenu &&
        (event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'Enter')
      ) {
        event.preventDefault()
      }

      if (!showSuggestionMenu && event.key === 'Enter' && !event.shiftKey) {
        dispatchAction({
          type: Action.ConceptCreate,
          data: {
            posType: PositionType.Normal,
            intent: ConceptCreatePositionIntent.Below,
            blockId,
          },
        })
        onInteractionEnd()
      }

      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, dispatchAction, showSuggestionMenu, onInteractionEnd])

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
      const suggestionMenuRect =
        suggestionMenuRef.current &&
        suggestionMenuRef.current.getBoundingClientRect()
      const mousedownCoords = getUnifiedClientCoords(e)
      const isInEditorView =
        editorViewRect && isPointInRect(mousedownCoords, editorViewRect)
      const isInTextActionMenu =
        textActionMenuRect && isPointInRect(mousedownCoords, textActionMenuRect)
      const isInSuggestionMenu =
        suggestionMenuRect && isPointInRect(mousedownCoords, suggestionMenuRect)

      if (
        /**
         * Only check when there's focus inside `EditorView` (including
         * nested `EditorView`s), to prevent unnecessary setState.
         */
        editorView.current.dom.contains(document.activeElement) &&
        !isInEditorView &&
        !isInTextActionMenu &&
        !isInSuggestionMenu
      ) {
        console.log('PMText: interaction end via mousedown')
        setShowTextActionMenu(false)
        closeSuggestionMenu()
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
        updateMenuState(view.state.selection)

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
        // Must call our ref function so that the getter works.
        keydown: (view, event) => onKeyDownRef.current(view, event),
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
        disablePasteWithMouseMiddleButton(),
        observeInlineSelection({
          onSelectionCreate: e => {
            setTextActionMenuPos({
              top: e.selectionBoundingRect.top - 50,
              left: e.selectionBoundingRect.left - 40,
            })
            setShowTextActionMenu(true)
          },
          onSelectionRemove: () => {
            setShowTextActionMenu(false)
          },
        }),
        observeKeyword({
          debug: false,
          rules: [
            {
              trigger: /\/$/,
              onTrigger: e => {
                openSuggestionMenu(SuggestFor.SlashCommands)
                setSlashMenuAnchorRect(e.keywordCoords.from)
                updateSuggestionMenu(e.keyword, {
                  from: e.keywordRange.from - e.triggerString.length,
                  to: e.keywordRange.to,
                })
              },
              onKeywordChange: e => {
                updateSuggestionMenu(e.keyword, {
                  from: e.keywordRange.from - e.triggerString.length,
                  to: e.keywordRange.to,
                })
              },
              onKeywordStop: closeSuggestionMenu,
            },
            {
              trigger: /(\[\[|@)$/,
              onTrigger: e => {
                openSuggestionMenu(SuggestFor.Mention)
                setSlashMenuAnchorRect(e.keywordCoords.from)
                updateSuggestionMenu(e.keyword, {
                  from: e.keywordRange.from - e.triggerString.length,
                  to: e.keywordRange.to,
                })
              },
              onKeywordChange: e => {
                updateSuggestionMenu(e.keyword, {
                  from: e.keywordRange.from - e.triggerString.length,
                  to: e.keywordRange.to,
                })
              },
              onKeywordStop: closeSuggestionMenu,
            },
          ],
        }),
        handleMarkClick({
          rules: [
            new MarkClickRule(linkMarkName, (attrs: LinkMark['attrs']) => {
              if (isInternalUrl(attrs.href)) {
                const conceptId = getConceptIdFromUrl(attrs.href)
                dispatchAction({
                  type: Action.BlockOpenAsCanvas,
                  data: { id: conceptId },
                })
              } else {
                openExternal(attrs.href)
              }
            }),
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
    <div
      ref={editorContainerRef}
      className={styles.EditorContainer}
      data-view-mode={props.viewMode}>
      {showPlaceholder && (
        <div className={styles.Placeholder} data-view-mode={props.viewMode}>
          Type &#39;/&#39; for commands
        </div>
      )}
    </div>
  )

  switch (props.viewMode) {
    case 'NavItem': {
      return <div className={styles.PMTextNavItem}>{editorContainer}</div>
    }
    case 'Block': {
      return (
        <>
          {editorContainer}
          {showSuggestionMenu ? (
            props.createOverlay(
              <PlaceMenu near={suggestionMenuAnchorRect}>
                <SuggestionMenu
                  ref={suggestionMenuRef}
                  optionGroups={optionGroups}
                  width={suggestFor === SuggestFor.SlashCommands ? 150 : 350}
                  onConfirmOption={confirmOption}
                  onCloseMenu={closeSuggestionMenu}
                />
              </PlaceMenu>
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
                  activeHighlightColor={activeHighlightColor}
                  activeLink={activeLink}
                  toggleBold={toggleBold}
                  toggleItalic={toggleItalic}
                  toggleStrike={toggleStrike}
                  toggleUnderline={toggleUnderline}
                  toggleCode={toggleCode}
                  turnIntoLatex={turnIntoLatex}
                  setHighlight={setHighlight}
                  setLink={setLink}
                />
              </div>
            )}
        </>
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
  toText: (concept: TypedConcept<PMTextContent>) => {
    const data = concept.summary.data?.data
    if (!data) return ''
    const doc = ProseNode.fromJSON(schema, data)
    return doc.textContent
  },
}
