import { Schema } from 'prosemirror-model'

import { styles } from './index.styles'
import { highlightMarkSpec } from './marks/highlight'
import { linkMarkSpec } from './marks/link'

export const schema = new Schema({
  nodes: {
    doc: { content: 'inline*' },
    /**
     * `text` is inline by default, so no need to specify `inline: true`.
     */
    text: { group: 'inline' },
    hard_break: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM() {
        return ['br']
      },
    },
    math_inline: {
      group: 'inline',
      content: 'text*',
      inline: true,
      atom: true,
      toDOM: () => ['math-inline', { class: 'math-node' }, 0],
      parseDOM: [
        {
          tag: 'math-inline',
        },
      ],
    },
  },
  marks: {
    bold: {
      toDOM() {
        return ['strong', 0]
      },
      parseDOM: [{ tag: 'strong' }],
    },
    italic: {
      toDOM() {
        return ['em', 0]
      },
      parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
    },
    underline: {
      toDOM() {
        return ['span', { class: styles.Underline }, 0]
      },
      parseDOM: [{ style: 'text-decoration=underline' }],
    },
    strike: {
      toDOM() {
        return ['s', 0]
      },
      parseDOM: [
        { tag: 'strike' },
        { tag: 's' },
        { style: 'text-decoration=line-through' },
      ],
    },
    code: {
      toDOM() {
        return ['code', { class: styles.Code }, 0]
      },
      parseDOM: [{ tag: 'code' }],
    },
    highlight: highlightMarkSpec,
    link: linkMarkSpec,
  },
})
