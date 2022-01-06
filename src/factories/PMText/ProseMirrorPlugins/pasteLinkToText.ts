import { Plugin } from 'prosemirror-state'
import { test as isLink, registerCustomProtocol } from 'linkifyjs'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'
import { schema } from '../ProseMirrorSchema/schema'

registerCustomProtocol('jade')

/**
 * Test cases:
 * - Pasting HTML when there's no selection should work as without this
 *   plugin.
 * - Pasting plain text that does not match above rules to selection should
 *   work as without this plugin.
 * - Pasting HTML whose text is link-ish should **NOT** add that link to
 *   the selection. Unless pasting in plain text mode (`Ctrl-Shift-C`).
 * - Pasting link-ish **plain text** should add that link to the selection.
 */
export function pasteLinkToText(): Plugin {
  return new Plugin({
    props: {
      handlePaste: (view, event) => {
        /** Pasted content must be plain text and a link. */
        const clipboardItems = Array.from(event.clipboardData.items)
        if (clipboardItems.length > 1) return false
        const clipboardItemType = clipboardItems[0].type
        if (clipboardItemType !== 'text/plain') return false
        const pastedText = event.clipboardData.getData(clipboardItemType)
        if (!isLink(pastedText)) return false

        /** Selection must be all text nodes. */
        const { selection } = view.state
        if (selection.from === selection.to) return false
        const selectionSlice = selection.content()
        let isTextSelection = true
        selectionSlice.content.forEach(node => {
          if (!node.text) isTextSelection = false
        })
        if (!isTextSelection) return false

        /** Alright, add a new link mark to the selection. */
        const url = pastedText
        const linkMark = schema.mark(schema.marks[linkMarkName], {
          href: url,
        } as LinkMark['attrs'])
        const pasteLinkTr = view.state.tr.addMark(
          selection.from,
          selection.to,
          linkMark
        )

        view.dispatch(pasteLinkTr)
        return true
      },
    },
  })
}
