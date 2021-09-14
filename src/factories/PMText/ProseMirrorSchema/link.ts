import { stylesheet } from 'typestyle'
import { MarkSpec, Mark, ParseRule } from 'prosemirror-model'

import theme from '../../../theme'

/** Better types. */
export interface LinkMark extends Mark {
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

/** Styles for link. */
export const styles = stylesheet({
  Link: {
    color: 'inherit',
    opacity: 0.75,
    cursor: 'pointer',
    textDecoration: 'none',
    borderBottom: `0.05em solid ${theme.colors.uiSecondaryDumb}`,
    $nest: {
      '&:hover': {
        borderBottom: `0.05em solid ${theme.colors.uiPrimary}`,
      },
    },
  },
})

/** MarkSpec for link. */
export const linkMarkName = 'link'
export const linkMarkSpec = {
  attrs: {
    href: { default: '#' },
    title: { default: null },
  },
  inclusive: false,
  toDOM(node) {
    const { href, title } = node.attrs
    return ['a', { class: styles.Link, href, title }, 0]
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
