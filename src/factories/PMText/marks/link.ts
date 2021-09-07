import { MarkSpec, Mark, ParseRule } from 'prosemirror-model'

interface LinkMark extends Mark {
  attrs: {
    href: string
    title: string
  }
}

interface LinkParseRule extends ParseRule {
  getAttrs: (el: Element) => LinkMark['attrs']
}

interface LinkMarkSpec extends MarkSpec {
  attrs: {
    href: { default: string }
    title: { default: null }
  }
  toDOM: (
    mark: LinkMark
  ) => [
    string,
    { href: string; title?: string } & {
      [attr: string]: string | null | undefined
    },
    0
  ]
  parseDOM: LinkParseRule[]
}

export const linkMarkSpec = {
  attrs: {
    href: {},
    title: { default: null },
  },
  inclusive: false,
  toDOM(node) {
    const { href, title } = node.attrs
    return ['a', { href, title }, 0]
  },
  parseDOM: [
    {
      tag: 'a[href]',
      getAttrs(dom) {
        return {
          href: dom.getAttribute('href'),
          title: dom.getAttribute('title'),
        }
      },
    },
  ],
} as LinkMarkSpec
