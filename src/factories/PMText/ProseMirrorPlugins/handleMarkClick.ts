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
        mousedown(view, pointerDownEvent) {
          /** Non primary buttons should not produce a click. */
          if (pointerDownEvent.button !== 0) return false

          function interpretClick(clickEvent: MouseEvent) {
            window.removeEventListener('click', interpretClick)
            const downPoint = getUnifiedClientCoords(pointerDownEvent)
            const upPoint = getUnifiedClientCoords(clickEvent)
            const moveThreshold = 3
            /** If the pointer moved beyond the threshold, it's not a click. */
            if (distanceOf(downPoint, upPoint) > moveThreshold) {
              clickEvent.preventDefault()
              return
            }

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
              if (matchRule) matchRule.handler(mark.attrs, clickEvent)
            })
          }

          window.addEventListener('click', interpretClick)
          return false
        },
      },
    },
  })
}
