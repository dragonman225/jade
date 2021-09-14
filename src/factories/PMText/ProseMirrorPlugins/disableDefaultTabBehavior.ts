import { Plugin } from 'prosemirror-state'

export function disableDefaultTabBehavior(): Plugin {
  function preventTab(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  let setupComplete = false

  return new Plugin({
    view: () => ({
      update: () => {
        if (setupComplete) return

        window.addEventListener('keydown', preventTab)
        setupComplete = true
      },
      destroy: () => {
        window.removeEventListener('keydown', preventTab)
      },
    }),
  })
}
