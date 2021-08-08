import { keymap } from 'prosemirror-keymap'
import { EditorState } from 'prosemirror-state'
import { Node } from 'prosemirror-model'
import { toggleMark } from 'prosemirror-commands'

import { schema } from './schema'
import { BaseConceptData } from '../../core/interfaces'

export function isDocEmpty(state: EditorState): boolean {
  return state.doc.content.size === 0
}

export function createEditorState(data: BaseConceptData): EditorState {
  /** Keyboard shortcuts. */
  const keymapPlugin = keymap({
    'Mod-b': toggleMark(schema.marks.bold),
    'Mod-i': toggleMark(schema.marks.italic),
    'Mod-u': toggleMark(schema.marks.underline),
    'Mod-Shift-s': toggleMark(schema.marks.strike),
    'Mod-e': toggleMark(schema.marks.code),
  })

  return EditorState.create({
    schema,
    doc: data.initialized ? Node.fromJSON(schema, data.data) : undefined,
    plugins: [keymapPlugin],
  })
}
