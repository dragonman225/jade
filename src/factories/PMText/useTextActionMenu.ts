import { useState, useRef } from 'react'
import { MarkType } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'

import {
  isBoldActive,
  isCodeActive,
  isItalicActive,
  isStrikeActive,
  isUnderlineActive,
  MarkActiveMap,
  setHighlightColor,
  toggleMarkOnSelection,
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

  return {
    textActionMenuRef,
    showTextActionMenu,
    setShowTextActionMenu,
    textActionMenuPos,
    setTextActionMenuPos,
    setMarkActiveMap,
    boldActive,
    italicActive,
    strikeActive,
    underlineActive,
    codeActive,
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleUnderline,
    toggleCode,
    activeHighlightColor,
    setActiveHighlightColor,
    setHighlight,
  }
}
