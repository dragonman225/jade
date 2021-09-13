import { useState, useRef, useCallback } from 'react'
import { MarkType } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { Selection } from 'prosemirror-state'

import {
  getActiveHighlightColor,
  getActiveLink,
  getActiveMarks,
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
import { schema } from './schema'
import { HighlightColor } from './marks/highlight'

// TODO: Define stable interface.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useTextActionMenu(editorView: EditorView<typeof schema>) {
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
    editorView.focus()
    setHighlightColor(editorView, editorView.state.selection, color)
  }

  const [activeLink, setActiveLink] = useState('')
  const setLink = (link: string) => {
    editorView.focus()
    setLinkHref(editorView, editorView.state.selection, link)
  }

  const turnIntoLatex = () => {
    editorView.focus()
    turnIntoMath(editorView, editorView.state.selection)
    setShowTextActionMenu(false)
  }

  const updateMenuState = useCallback((selection: Selection) => {
    setMarkActiveMap(getActiveMarks(selection))
    setActiveHighlightColor(getActiveHighlightColor(selection))
    setActiveLink(getActiveLink(selection))
  }, [])

  return {
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
  }
}
