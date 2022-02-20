import { Mark } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'

import { distanceOf, getUnifiedClientCoords } from '../../../core/utils'

export class MarkClickRule {
  markName: string
  handler: (attrs: Mark['attrs'], event: MouseEvent) => void

  constructor(
    markName: string,
    handler: (attrs: Mark['attrs'], event: MouseEvent) => void
  ) {
    this.markName = markName
    this.handler = handler
  }
}

export function handleMarkClick({
  rules = [],
}: {
  rules: MarkClickRule[]
}): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown(view, downEvent) {
          /** Non primary buttons should not produce a click. */
          if (downEvent.button !== 0) return false

          function handleUp(upEvent: MouseEvent) {
            window.removeEventListener('mouseup', handleUp)
            const downPoint = getUnifiedClientCoords(downEvent)
            const upPoint = getUnifiedClientCoords(upEvent)
            const maxMovement = 3
            /** If the pointer moves too much, it's not a click. */
            if (distanceOf(downPoint, upPoint) > maxMovement) return

            /** If it's a click, we call the handlers. */
            const posInfo = view.posAtCoords({
              left: upPoint.x,
              top: upPoint.y,
            })
            if (!posInfo) return
            const node = view.state.doc.nodeAt(posInfo.pos)
            if (!node) return
            node.marks.forEach(mark => {
              const matchRule = rules.find(
                rule => rule.markName === mark.type.name
              )
              if (matchRule) matchRule.handler(mark.attrs, upEvent)
            })
          }

          window.addEventListener('mouseup', handleUp)
          return false
        },
        /** Prevent default link navigation when not editable. */
        click(_view, event) {
          event.preventDefault()
          return false
        },
        /** Prevent opening link in a new tab (Chromium) or a new window
         * (Electron) when panning. */
        auxclick(_view, event) {
          event.preventDefault()
          return false
        },
        /** Prevent dragging link when not editable. */
        dragstart(_view, event) {
          event.preventDefault()
          return false
        },
      },
    },
  })
}
