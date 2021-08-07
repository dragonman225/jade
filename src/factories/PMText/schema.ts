import { Schema } from 'prosemirror-model'

export const schema = new Schema({
  nodes: {
    doc: { content: 'text*' },
    text: { inline: true },
  },
  marks: {
    bold: {
      toDOM() {
        return ['strong']
      },
    },
    italic: {
      toDOM() {
        return ['em']
      },
    },
    underline: {
      toDOM() {
        return ['span', { style: 'text-decoration: underline;' }]
      },
    },
    strike: {
      toDOM() {
        return ['strike']
      },
    },
    code: {
      toDOM() {
        return ['code']
      },
    },
  },
})
