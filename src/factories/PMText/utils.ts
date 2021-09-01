import { EditorState, Selection, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { MarkType, Node, Schema, Fragment, Slice } from 'prosemirror-model'
import { Command, toggleMark } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { InputRule, inputRules } from 'prosemirror-inputrules'
import { redo, undo } from 'prosemirror-history'
import {
  REGEX_INLINE_MATH_DOLLARS,
  makeInlineMathInputRule,
} from '@dragonman225/prosemirror-math'

import { schema } from './schema'
import { markingInputRule, markingPatterns } from './markingInputRule'

export function isProseMirrorDocEmpty(doc: Node): boolean {
  return doc && doc.content.size === 0
}

export function getProseMirrorDoc(
  jsonDoc: unknown | undefined,
  schema: Schema
): Node | undefined {
  return jsonDoc ? Node.fromJSON(schema, jsonDoc) : undefined
}

/**
 * Keyboard shortcuts.
 *
 * TODO:
 * @see https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/keymap.js
 *
 * TODO: bug
 *   The browser has native undo history
 *   (https://discuss.prosemirror.net/t/native-undo-history/1823/8)
 *   and ProseMirror doesn't do anything about it. To reproduce, edit,
 *   click outside to blur, hit Mod-z. It's confirmed to be native by
 *   removing undo/redo from keymap.
 */
export const keymapPlugin = keymap({
  'Mod-b': toggleMark(schema.marks.bold),
  'Mod-i': toggleMark(schema.marks.italic),
  'Mod-u': toggleMark(schema.marks.underline),
  'Mod-Shift-s': toggleMark(schema.marks.strike),
  'Mod-e': toggleMark(schema.marks.code),
  'Shift-Enter': insertHardBreak,
  'Mod-z': whenHasFocus(undo),
  'Shift-Mod-z': whenHasFocus(redo),
})

/** Input rules, e.g. Markdown shortcuts. */
export const inputRulesPlugin = inputRules({
  rules: [
    markingInputRule(markingPatterns.BoldAndItalicWithTripleStars, [
      schema.marks.bold,
      schema.marks.italic,
    ]),
    markingInputRule(markingPatterns.BoldWithDoubleStars, schema.marks.bold),
    markingInputRule(
      markingPatterns.BoldWithDoubleUnderscores,
      schema.marks.bold
    ),
    markingInputRule(markingPatterns.CodeWithSingleBacktick, schema.marks.code),
    markingInputRule(markingPatterns.ItalicWithSingleStar, schema.marks.italic),
    markingInputRule(
      markingPatterns.ItalicWithSingleUnderscore,
      schema.marks.italic
    ),
    markingInputRule(
      markingPatterns.StrikeWithDoubleTilde,
      schema.marks.strike
    ),
    new InputRule(/->$/, '→'),
    new InputRule(/=>$/, '⇒'),
    new InputRule(/!=$/, '≠'),
    new InputRule(/--$/, '—'),
    makeInlineMathInputRule(
      REGEX_INLINE_MATH_DOLLARS,
      schema.nodes.math_inline
    ),
  ],
})

/**
 * A command that inserts a `hard_break` node.
 * @see https://prosemirror.net/examples/schema/
 */
export function insertHardBreak(
  state: EditorState,
  dispatch: (tr: Transaction<typeof schema>) => void
): boolean {
  const type = schema.nodes.hard_break
  const { $from } = state.selection
  if (!$from.parent.canReplaceWith($from.index(), $from.index(), type))
    return false
  dispatch(state.tr.replaceSelectionWith(type.create()))
  return true
}

/** Wraps a command so that it runs when the EditorView has focus. */
export function whenHasFocus(command: Command): Command {
  return (state, dispatch, view) => {
    if (view.hasFocus()) return command(state, dispatch, view)
    return false
  }
}

export type MarkActiveMap = Map<MarkType, boolean>

export function toggleMarkOnSelection(
  view: EditorView<Schema>,
  selection: Selection,
  markActiveMap: MarkActiveMap,
  markType: MarkType
): void {
  const { from, to } = selection
  markActiveMap.get(markType)
    ? view.dispatch(view.state.tr.removeMark(from, to, markType))
    : view.dispatch(
        view.state.tr.addMark(from, to, view.state.schema.mark(markType))
      )
}

/** A mark is active if all text nodes in the selection has it. */
export function getActiveMarks(selection: Selection): MarkActiveMap {
  const slice = selection.content()
  const textNodes: Node[] = []
  slice.content.descendants(node => {
    if (node.isText) textNodes.push(node)
  })
  const markActiveMap = new Map<MarkType, boolean>()
  if (!textNodes) return markActiveMap
  const markCountMap = new Map<MarkType, number>()
  textNodes.forEach(n => {
    /**
     * There may be multiple marks of the same type in a text node.
     * Need to ensure at least one in every node.
     */
    n.marks.forEach(m => {
      markCountMap.set(m.type, (markCountMap.get(m.type) || 0) + 1)
    })
  })
  markCountMap.forEach((count, markType) => {
    markActiveMap.set(markType, count === textNodes.length)
  })
  return markActiveMap
}

export function isBoldActive(markActiveMap: MarkActiveMap): boolean {
  return !!markActiveMap.get(schema.marks.bold)
}

export function isItalicActive(markActiveMap: MarkActiveMap): boolean {
  return !!markActiveMap.get(schema.marks.italic)
}

export function isStrikeActive(markActiveMap: MarkActiveMap): boolean {
  return !!markActiveMap.get(schema.marks.strike)
}

export function isUnderlineActive(markActiveMap: MarkActiveMap): boolean {
  return !!markActiveMap.get(schema.marks.underline)
}

export function isCodeActive(markActiveMap: MarkActiveMap): boolean {
  return !!markActiveMap.get(schema.marks.code)
}

export function turnIntoMath(view: EditorView, selection: Selection): void {
  const text = view.state.doc.textBetween(selection.from, selection.to)
  const mathInlineNode = schema.node(
    'math_inline',
    undefined,
    schema.text(text)
  )
  const fragment = Fragment.from(mathInlineNode)
  const slice = new Slice(fragment, 0, 0)
  view.dispatch(view.state.tr.replaceRange(selection.from, selection.to, slice))
}
