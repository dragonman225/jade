import { keymap } from 'prosemirror-keymap'
import { EditorState, Transaction } from 'prosemirror-state'
import { Node } from 'prosemirror-model'
import { Command, toggleMark } from 'prosemirror-commands'
import { history, redo, undo } from 'prosemirror-history'

import { schema } from './schema'

export function isDocEmpty(state: EditorState): boolean {
  return state.doc.content.size === 0
}

export function createEditorState(jsonDoc?: unknown): EditorState {
  /**
   * Keyboard shortcuts.
   *
   * TODO:
   * @see https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/keymap.js
   *
   * TODO: bug
   *    The browser has native undo history
   *    (https://discuss.prosemirror.net/t/native-undo-history/1823/8)
   *    and ProseMirror doesn't do anything about it. To reproduce, edit,
   *    click outside to blur, hit Mod-z. It's confirmed to be native by
   *    removing undo/redo from keymap.
   */
  const keymapPlugin = keymap({
    'Mod-b': toggleMark(schema.marks.bold),
    'Mod-i': toggleMark(schema.marks.italic),
    'Mod-u': toggleMark(schema.marks.underline),
    'Mod-Shift-s': toggleMark(schema.marks.strike),
    'Mod-e': toggleMark(schema.marks.code),
    'Shift-Enter': insertHardBreak,
    'Mod-z': whenHasFocus(undo),
    'Shift-Mod-z': whenHasFocus(redo),
  })

  return EditorState.create({
    schema,
    doc: jsonDoc ? Node.fromJSON(schema, jsonDoc) : undefined,
    plugins: [keymapPlugin, history()],
  })
}

/**
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

export function whenHasFocus(command: Command): Command {
  return (state, dispatch, view) => {
    if (view.hasFocus()) return command(state, dispatch, view)
    return false
  }
}
