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
    code: {
      toDOM() {
        return ['code']
      },
    },
  },
})
