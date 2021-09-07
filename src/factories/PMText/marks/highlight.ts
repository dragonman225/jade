import { stylesheet } from 'typestyle'
import { MarkSpec, Mark, ParseRule } from 'prosemirror-model'

/** Better types. */
interface HighlightMark extends Mark {
  attrs: { color: string }
}

interface HighlightParseRule extends ParseRule {
  getAttrs: (el: Element) => HighlightMark['attrs']
}

interface HighlightMarkSpec extends MarkSpec {
  attrs: { color: { default: string } }
  toDOM: (
    mark: HighlightMark
  ) => [
    string,
    { 'data-color': string } & { [attr: string]: string | null | undefined },
    0
  ]
  parseDOM: HighlightParseRule[]
}

/** Supported colors. */
export enum HighlightColor {
  BackgroundYellow = 'bg-yellow',
}

/** Styles for highlight. */
export const styles = stylesheet({
  Highlight: {
    $nest: {
      [`&[data-color="${HighlightColor.BackgroundYellow}"]`]: {
        background: '#ffe066',
      },
    },
  },
})

/** MarkSpec for highlight. */
export const highlightMarkSpec = {
  attrs: {
    color: {
      default: 'bg-yellow',
    },
  },
  toDOM(mark) {
    const { color } = mark.attrs
    return ['mark', { class: styles.Highlight, 'data-color': color }, 0]
  },
  parseDOM: [
    {
      tag: 'mark',
      getAttrs(dom) {
        return { color: dom.getAttribute('data-color') }
      },
    },
  ],
} as HighlightMarkSpec
