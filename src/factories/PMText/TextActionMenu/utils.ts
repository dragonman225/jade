import {
  Fragment,
  MarkType,
  Slice,
  Node,
  Mark,
  Schema,
} from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { schema } from '../ProseMirrorSchema/schema'
import {
  HighlightColor,
  HighlightMark,
  highlightMarkName,
} from '../ProseMirrorSchema/highlight'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'

export type MarkActiveMap = Map<MarkType, boolean>

/** From Selection, Slice, Range (from, to). */

export function collectTextNodesFromSlice(slice: Slice): Node[] {
  const textNodes: Node[] = []
  slice.content.descendants(node => {
    if (node.isText) textNodes.push(node)
  })
  return textNodes
}

export function collectTextNodesFromSelection(selection: Selection): Node[] {
  const slice = selection.content()
  return collectTextNodesFromSlice(slice)
}

/** A mark is active if all text nodes in the selection has it. */
export function getActiveMarksFromTextNodes(textNodes: Node[]): MarkActiveMap {
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

export function getActiveMarksFromSlice(slice: Slice): MarkActiveMap {
  const textNodes = collectTextNodesFromSlice(slice)
  return getActiveMarksFromTextNodes(textNodes)
}

export function getActiveMarksFromSelection(
  selection: Selection
): MarkActiveMap {
  const textNodes = collectTextNodesFromSelection(selection)
  return getActiveMarksFromTextNodes(textNodes)
}

/** Determine if two attributes are equal. */
type MarkAttrsComparator<T> = (
  anchorAttrs: T | undefined,
  currentAttrs: T | undefined
) => boolean

type GetActiveMarkFn<T> = (
  markName: string,
  from: T,
  isAttrsEqual: MarkAttrsComparator<Mark['attrs']>
) => Mark | undefined

export const getActiveMarkFromTextNodes: GetActiveMarkFn<Node[]> = (
  markName,
  textNodes,
  isAttrsEqual
) => {
  /** The first text node determines the anchor attrs. */
  if (!textNodes[0]) return undefined
  const anchorMark = textNodes[0].marks.find(m => m.type.name === markName)
  if (!anchorMark) return undefined

  /** Ensure all text nodes has the same mark and the attrs are equal. */
  for (let i = 1; i < textNodes.length; i++) {
    const textNode = textNodes[i]
    const currentMark = textNode.marks.find(m => m.type.name === markName)
    if (!currentMark) return undefined
    if (!isAttrsEqual(anchorMark.attrs, currentMark.attrs)) return undefined
  }

  return anchorMark
}

export const getActiveMarkFromSlice: GetActiveMarkFn<Slice> = (
  markName,
  slice,
  isAttrsEqual
) => {
  const textNodes = collectTextNodesFromSlice(slice)
  return getActiveMarkFromTextNodes(markName, textNodes, isAttrsEqual)
}

export const getActiveMarkFromSelection: GetActiveMarkFn<Selection> = (
  markName,
  selection,
  isAttrsEqual
) => {
  const textNodes = collectTextNodesFromSelection(selection)
  return getActiveMarkFromTextNodes(markName, textNodes, isAttrsEqual)
}

export const isHighlightMarkAttrsEqual: MarkAttrsComparator<
  HighlightMark['attrs']
> = (anchorAttrs, currentAttrs) => {
  if (!anchorAttrs || !currentAttrs) return false
  return anchorAttrs.color === currentAttrs.color
}

export function getActiveHighlightColorFromSlice(
  slice: Slice
): HighlightColor | undefined {
  const mark = getActiveMarkFromSlice(
    highlightMarkName,
    slice,
    isHighlightMarkAttrsEqual
  ) as HighlightMark

  return mark && mark.attrs.color
}

export function getActiveHighlightColorFromSelection(
  selection: Selection
): HighlightColor | undefined {
  const mark = getActiveMarkFromSelection(
    highlightMarkName,
    selection,
    isHighlightMarkAttrsEqual
  ) as HighlightMark

  return mark && mark.attrs.color
}

export function getActiveLink(selection: Selection): string {
  const mark = getActiveMarkFromSelection(
    linkMarkName,
    selection,
    (anchorAttrs: LinkMark['attrs'], currentAttrs: LinkMark['attrs']) =>
      anchorAttrs.href === currentAttrs.href
  ) as LinkMark

  return mark && mark.attrs ? mark.attrs.href : ''
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

export function setHighlightColor(
  view: EditorView,
  selection: Selection,
  color: HighlightColor | undefined
): void {
  const mark = schema.mark(highlightMarkName, { color }) as HighlightMark
  if (color)
    view.dispatch(view.state.tr.addMark(selection.from, selection.to, mark))
  else
    view.dispatch(
      view.state.tr.removeMark(
        selection.from,
        selection.to,
        schema.marks[highlightMarkName]
      )
    )
}

export function setLinkHref(
  view: EditorView,
  selection: Selection,
  href: string
): void {
  const mark = schema.mark(linkMarkName, { href }) as LinkMark
  if (href)
    view.dispatch(view.state.tr.addMark(selection.from, selection.to, mark))
  else
    view.dispatch(
      view.state.tr.removeMark(
        selection.from,
        selection.to,
        schema.marks[linkMarkName]
      )
    )
}
