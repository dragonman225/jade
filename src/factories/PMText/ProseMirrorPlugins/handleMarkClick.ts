import { Mark } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'

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
      handleClick(view, pos, event) {
        const { doc } = view.state
        const node = doc.nodeAt(pos)
        if (!node) return false
        node.marks.forEach(mark => {
          const matchRule = rules.find(rule => rule.markName === mark.type.name)
          if (matchRule) matchRule.handler(mark.attrs, event)
        })
        return false
      },
    },
  })
}
