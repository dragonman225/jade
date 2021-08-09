import { Schema } from 'prosemirror-model'

import { styles } from './index.styles'

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
        return ['span', { style: 'text-decoration: underline;' }, 0]
      },
      parseDOM: [{ style: 'text-decoration=underline' }],
    },
    strike: {
      toDOM() {
        return ['strike', 0]
      },
      parseDOM: [{ tag: 'strike' }],
    },
    code: {
      toDOM() {
        return ['code', { class: styles.Code }, 0]
      },
      parseDOM: [{ tag: 'code' }],
    },
  },
})
