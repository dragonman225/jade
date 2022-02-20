import { Plugin } from 'prosemirror-state'

/** Pasting with the mouse's middle button is a hard-coded behavior in X11. */
export function disablePasteWithMouseMiddleButton(): Plugin {
  let setupComplete = false
  let preventNextPaste = false

  function handleMouseDown(event: MouseEvent) {
    if (event.button === 1) {
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
