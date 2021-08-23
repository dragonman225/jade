import { Plugin } from 'prosemirror-state'

export function disableFocusAndPasteWithMouseMiddleButton(): Plugin {
  let setupComplete = false
  let preventNextPaste = false

  function handleMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      /** Preventing mousedown also prevents focus. */
      event.preventDefault()
      preventNextPaste = true
    } else {
      preventNextPaste = false
    }
  }

  return new Plugin({
    view: () => ({
      update: () => {
        if (setupComplete) return

        window.addEventListener('mousedown', handleMouseDown)
        setupComplete = true
      },
      destroy: () => {
        window.removeEventListener('mousedown', handleMouseDown)
      },
    }),
    props: {
      handleDOMEvents: {
        paste: (_, event) => {
          if (preventNextPaste) {
            event.preventDefault()
            preventNextPaste = false
          }
          return false
        },
      },
    },
  })
}
