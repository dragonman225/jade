import { Plugin } from 'prosemirror-state'
import { test as isUrl, registerCustomProtocol } from 'linkifyjs'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'
import { schema } from '../ProseMirrorSchema/schema'

registerCustomProtocol('jade')

/**
 * Test cases:
 * - Pasting HTML when there's no selection should work as without this plugin.
 * - Pasting plain text when there's no selection should create linked link if it's link-ish.
 * - Pasting plain text when there's selection should add the link to selection is it's link-ish.
 * - Pasting HTML whose text is link-ish should **NOT** add the link to
 *   the selection. Unless you force pasting it as plain text with `Ctrl-Shift-C`.
 */
export function pasteLinkToText(): Plugin {
  return new Plugin({
    props: {
      handlePaste: (view, event) => {
        /** Pasted content must contain only text/plain type and is a link. */
        const clipboardItems = Array.from(event.clipboardData.items)
        if (clipboardItems.length > 1) return false
        const clipboardItemType = clipboardItems[0].type
        if (clipboardItemType !== 'text/plain') return false
        const pastedText = event.clipboardData.getData(clipboardItemType)
        if (!isUrl(pastedText)) return false
        const pastedUrl = pastedText

        const { selection } = view.state
        /** Create linked text if the selection is collapsed. */
        if (selection.from === selection.to) {
          const linkedTextNode = schema.text(pastedUrl, [
            createLinkMark(pastedUrl),
          ])
          const pasteLinkTr = view.state.tr.insert(
            selection.from,
            linkedTextNode
          )

          view.dispatch(pasteLinkTr)
          return true
        }

        /**
         * To paste the URL to existing text, the selection must be all
         * text nodes.
         */
        const selectionSlice = selection.content()
        let isTextSelection = true
        selectionSlice.content.forEach(node => {
          if (!node.isText) isTextSelection = false
        })
        if (!isTextSelection) return false

        /** Alright, add a new link mark to the selection. */
        const linkMark = createLinkMark(pastedUrl)
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

function createLinkMark(href: string) {
  return schema.mark(schema.marks[linkMarkName], {
    href,
  } as LinkMark['attrs'])
}
