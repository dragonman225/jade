import { useState, useRef, useCallback } from 'react'
import { MarkType } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { Selection } from 'prosemirror-state'

import {
  createInlineSelectionObserver,
  InlineSelectionObserver,
} from './inlineSelectionObserver'
import {
  getActiveHighlightColorFromSelection,
  getActiveLink,
  getActiveMarksFromSelection,
  isBoldActive,
  isCodeActive,
  isItalicActive,
  isStrikeActive,
  isUnderlineActive,
  MarkActiveMap,
  setHighlightColor,
  setLinkHref,
  toggleMarkOnSelection,
  turnIntoMath,
} from './utils'
import { PMTextSchema, schema } from '../ProseMirrorSchema/schema'
import { HighlightColor } from '../ProseMirrorSchema/highlight'

// TODO: Define stable interface.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useTextActionMenu(
  editorView: EditorView<PMTextSchema> | null | undefined
) {
  const textActionMenuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
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
    if (!editorView) return
    editorView.focus()
    toggleMarkOnSelection(
      editorView,
      editorView.state.selection,
      markActiveMap,
      markType
    )
  }
  const toggleBold = createToggleMark(schema.marks.bold)
  const toggleItalic = createToggleMark(schema.marks.italic)
  const toggleStrike = createToggleMark(schema.marks.strike)
  const toggleUnderline = createToggleMark(schema.marks.underline)
  const toggleCode = createToggleMark(schema.marks.code)

  const [activeHighlightColor, setActiveHighlightColor] = useState<
    HighlightColor | undefined
  >(undefined)
  const setHighlight = (color: HighlightColor) => {
    if (!editorView) return
    editorView.focus()
    setHighlightColor(editorView, editorView.state.selection, color)
  }

  const [activeLink, setActiveLink] = useState('')
  const setLink = (link: string) => {
    if (!editorView) return
    editorView.focus()
    setLinkHref(editorView, editorView.state.selection, link)
  }

  const turnIntoLatex = () => {
    if (!editorView) return
    editorView.focus()
    turnIntoMath(editorView, editorView.state.selection)
    setIsOpen(false)
  }

  const updateMenuState = useCallback((selection: Selection) => {
    setMarkActiveMap(getActiveMarksFromSelection(selection))
    setActiveHighlightColor(getActiveHighlightColorFromSelection(selection))
    setActiveLink(getActiveLink(selection))
  }, [])

  const openTextActionMenu = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeTextActionMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const rInlineSelectionObserver = useRef<InlineSelectionObserver>()
  if (!rInlineSelectionObserver.current) {
    rInlineSelectionObserver.current = createInlineSelectionObserver({
      onSelectionCreate: e => {
        setTextActionMenuPos({
          top: e.selectionBoundingRect.top - 50,
          left: e.selectionBoundingRect.left - 40,
        })
        openTextActionMenu()
      },
      onSelectionRemove: () => {
        closeTextActionMenu()
      },
    })
  }

  return {
    textActionMenuRef,
    shouldShowTextActionMenu: isOpen,
    openTextActionMenu,
    closeTextActionMenu,
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
    /** Stable across the lifetime of the component that use this hook. */
    inlineSelectionObserver: rInlineSelectionObserver.current,
  }
}
