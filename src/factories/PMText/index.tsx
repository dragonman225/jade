import '@dragonman225/prosemirror-math/style/math.css'
import 'katex/dist/katex.min.css'

import * as React from 'react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AllSelection, EditorState, Selection } from 'prosemirror-state'
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
import { schema } from './ProseMirrorSchema/schema'
import {
  getProseMirrorDoc,
  inputRulesPlugin,
  isProseMirrorDocEmpty,
  keymapPlugin,
} from './utils'
import { useFunctionRef } from './useFunctionRef'
import { PMTextContent } from './types'
import { disablePasteWithMouseMiddleButton } from './ProseMirrorPlugins/disableFocusAndPasteWithMouseMiddleButton'
import {
  handleMarkClick,
  MarkClickRule,
} from './ProseMirrorPlugins/handleMarkClick'
import { LinkMark, linkMarkName } from './ProseMirrorSchema/link'
import { pasteLinkToText } from './ProseMirrorPlugins/pasteLinkToText'
import {
  ConceptDisplayProps,
  Factory,
  InteractionMode,
  PositionType,
  TypedConcept,
} from '../../core/interfaces'
import { Action, ConceptCreatePositionIntent } from '../../core/store/actions'
import { PlaceMenu } from '../../core/components/PlaceMenu'
import { useSystem } from '../../core/store/systemContext'
import { resolveInternalUrl, isInternalUrl } from '../../core/utils/url'
import {
  SyntheticFocusCallbackFn,
  useSyntheticFocus,
} from '../../core/utils/useSyntheticFocus'
import { useAppState } from '../../core/store/appStateContext'
import { findBlock } from '../../core/utils/block'

type Props = ConceptDisplayProps<PMTextContent>

const PMText: React.FunctionComponent<Props> = props => {
  const {
    concept,
    blockId,
    viewMode,
    readOnly,
    onChange,
    onReplace,
    onInteractionStart,
    onInteractionEnd,
  } = props
  const { blocks } = useAppState()
  const {
    dispatchAction,
    openExternal,
    createOverlay,
    factoryRegistry,
    db: database,
  } = useSystem()

  const block = findBlock(blocks, blockId)
  const [isFocusing, setIsFocusing] = useState(
    block?.mode === InteractionMode.Focusing
  )

  /** ProseMirror */
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const rEditorContainerEl = useRef<HTMLDivElement | null>(null)
  const rEditorView = useRef<EditorView | null>(null)

  /** TextActionMenu */
  const {
    textActionMenuRef,
    shouldShowTextActionMenu,
    closeTextActionMenu,
    textActionMenuPos,
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
    inlineSelectionObserver,
  } = useTextActionMenu(rEditorView.current)

  /** SuggestionMenu */
  const suggestionMenuRef = useRef<HTMLDivElement>(null)
  const {
    models: suggestionMenuModels,
    operations: suggestionMenuOperations,
    utils: { keywordObserver },
  } = useSuggestionMenu(
    database,
    factoryRegistry,
    onInteractionEnd,
    onReplace,
    rEditorView.current
  )
  const {
    showSuggestionMenu,
    optionGroups,
    suggestFor,
    selectedOptionIndex,
    suggestionMenuAnchorRect,
  } = suggestionMenuModels
  const {
    closeSuggestionMenu,
    confirmOption,
    selectOption,
    selectPrevOption,
    selectNextOption,
  } = suggestionMenuOperations

  const rOnKeyDown =
    useFunctionRef<(view: EditorView, event: KeyboardEvent) => boolean>()
  useEffect(() => {
    rOnKeyDown.current = (view: EditorView, event: KeyboardEvent) => {
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

      if (
        viewMode === 'Block' && // To avoid running in HeaderTool.
        !showSuggestionMenu && // Enter is for confirming an option.
        !event.shiftKey && // Shift + Enter is for hard break.
        event.key === 'Enter'
      ) {
        const selection = window.getSelection()
        selection && selection.removeAllRanges()
        rEditorView.current &&
          rEditorView.current.setProps({ editable: () => false })

        closeTextActionMenu()
        closeSuggestionMenu()
        setIsFocusing(false)
        onInteractionEnd()

        dispatchAction({
          type: Action.ConceptCreate,
          data: {
            posType: PositionType.Normal,
            intent: ConceptCreatePositionIntent.Below,
            blockId,
          },
        })
      }

      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, dispatchAction, showSuggestionMenu, onInteractionEnd, viewMode])

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
        // Must call our ref function so that the getter works.
        keydown: (view, event) => rOnKeyDown.current(view, event),
      },
      editable: () => false,
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
        inlineSelectionObserver.plugin,
        keywordObserver.plugin,
        handleMarkClick({
          rules: [
            new MarkClickRule(linkMarkName, (attrs: LinkMark['attrs']) => {
              if (isInternalUrl(attrs.href)) {
                const internalUrl = resolveInternalUrl(attrs.href)
                if (!internalUrl.conceptId) return
                dispatchAction({
                  type: Action.BlockOpenAsCanvas,
                  data: {
                    id: internalUrl.conceptId,
                    focusBlockId: internalUrl.blockId,
                  },
                })
              } else {
                openExternal(attrs.href)
              }
            }),
          ],
        }),
        mathPlugin,
        pasteLinkToText(),
      ],
    })

    if (!rEditorContainerEl.current) return () => 0 /** dummy */

    const view = createEditorView(rEditorContainerEl.current, state)
    rEditorView.current = view

    /** Auto-focusing newly created text block. */
    if (!concept.summary.data.initialized) {
      view.setProps({ editable: () => true })
      view.focus()
      setIsFocusing(true)
      onInteractionStart()
      onChange({ initialized: true })
    }

    setShowPlaceholder(isProseMirrorDocEmpty(state.doc))

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
    // console.log('PMText: update content')

    const view = rEditorView.current
    if (!view) return

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
    const { state } = view
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
  }, [concept.summary.data.data])

  const onFocus = useCallback<SyntheticFocusCallbackFn>(
    e => {
      /** Should not set cursor when readOnly. */
      if (readOnly || !rEditorView.current) return

      const posInfo = rEditorView.current.posAtCoords({
        left: e.clientX,
        top: e.clientY,
      })
      if (!posInfo) return

      console.log('PMText: interaction start via synthetic focus')

      const resolvedPos = rEditorView.current.state.doc.resolve(posInfo.pos)
      rEditorView.current.dispatch(
        rEditorView.current.state.tr.setSelection(Selection.near(resolvedPos))
      )
      rEditorView.current.setProps({ editable: () => true })
      rEditorView.current.focus()
      setIsFocusing(true)
      onInteractionStart()
    },
    [readOnly, onInteractionStart]
  )

  /**
   * Detect "blur". We need to consider the interaction between EditorView,
   * TextActionMenu, and SuggestionMenu.
   */
  const onPointerDownOutside = useCallback<SyntheticFocusCallbackFn>(
    e => {
      /** Save some unnecessary computation. */
      if (!isFocusing) return

      const editorViewEl = !!rEditorView.current && rEditorView.current.dom
      const textActionMenuEl = textActionMenuRef.current
      const suggestionMenuEl = suggestionMenuRef.current
      const isInEditorView =
        !!editorViewEl && editorViewEl.contains(e.target as Element)
      const isInTextActionMenu =
        !!textActionMenuEl && textActionMenuEl.contains(e.target as Element)
      const isInSuggestionMenu =
        !!suggestionMenuEl && suggestionMenuEl.contains(e.target as Element)

      if (!isInEditorView && !isInTextActionMenu && !isInSuggestionMenu) {
        console.log('PMText: interaction end via synthetic pointerDownOutside')

        const selection = window.getSelection()
        selection && selection.removeAllRanges()
        rEditorView.current &&
          rEditorView.current.setProps({ editable: () => false })

        closeTextActionMenu()
        closeSuggestionMenu()
        setIsFocusing(false)
        onInteractionEnd()

        /**
         * Below is not working. The old selection persists in the view
         * until future focus, and the future focus shows the
         * selection being set in setSelection() instead of
         * responding to the intention of the mouse.
         */
        // const state = view.state
        // view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, 0)))
      }
    },
    [
      isFocusing,
      onInteractionEnd,
      closeSuggestionMenu,
      closeTextActionMenu,
      textActionMenuRef,
    ]
  )

  const { setNodeRef } = useSyntheticFocus({
    onFocus,
    onPointerDownOutside,
    externalHasFocus: isFocusing,
  })

  const editorContainer = useMemo(
    () => (
      <div
        ref={node => {
          setNodeRef(node)
          rEditorContainerEl.current = node
        }}
        className={styles.EditorContainer}
        data-view-mode={props.viewMode}>
        {showPlaceholder && (
          <div className={styles.Placeholder} data-view-mode={props.viewMode}>
            {isFocusing ? `Type '/' for commands` : 'Wanna capture something'}
          </div>
        )}
      </div>
    ),
    [isFocusing, props.viewMode, showPlaceholder, setNodeRef]
  )

  switch (props.viewMode) {
    case 'NavItem': {
      return <div className={styles.PMTextNavItem}>{editorContainer}</div>
    }
    case 'Block':
    case 'CardTitle': {
      return (
        <>
          {props.viewMode === 'Block' ? (
            editorContainer
          ) : (
            <div className={styles.PMTextCardTitle}>{editorContainer}</div>
          )}
          {showSuggestionMenu &&
            createOverlay(
              <PlaceMenu near={suggestionMenuAnchorRect}>
                <SuggestionMenu
                  ref={suggestionMenuRef}
                  optionGroups={optionGroups}
                  selectedOptionIndex={selectedOptionIndex}
                  width={suggestFor === SuggestFor.SlashCommands ? 150 : 350}
                  onConfirmOption={confirmOption}
                  onCloseMenu={closeSuggestionMenu}
                  onSelectOption={selectOption}
                  onSelectPrevOption={selectPrevOption}
                  onSelectNextOption={selectNextOption}
                />
              </PlaceMenu>
            )}
          {shouldShowTextActionMenu &&
            createOverlay(
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
