import { Plugin, Selection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

/**
 * Copied from `prosemirror-keymap`.
 * @see https://github.com/ProseMirror/prosemirror-keymap/blob/master/src/keymap.js#L6
 */
const isMac =
  typeof navigator != 'undefined' ? /Mac/.test(navigator.platform) : false

function noop() {
  return
}

/** Check if the selection is an inline selection. */
function isInlineSelection(selection: Selection): boolean {
  /** `from` and `to` must be in the same parent. */
  if (!selection.$from.sameParent(selection.$to)) return false
  /** And the parent must directly contain inline nodes. */
  return selection.$from.parent.isTextblock
}

type Rect = {
  top: number
  right: number
  bottom: number
  left: number
}

export interface SelectionEvent {
  /** `Selection.from`. */
  from: number
  /** `Selection.to`. */
  to: number
  /** A zero-width rect representing `Selection.from` in the viewport. */
  fromRect: Rect
  /** A zero-width rect representing `Selection.to` in the viewport. */
  toRect: Rect
  /** The bounding box of the selection. */
  selectionBoundingRect: DOMRect
}

interface PluginOptions {
  onSelectionCreate?: (event: SelectionEvent) => void
  onSelectionRemove?: () => void
}

export interface InlineSelectionObserver {
  plugin: Plugin
}

export function createInlineSelectionObserver({
  onSelectionCreate = noop,
  onSelectionRemove = noop,
}: PluginOptions = {}): InlineSelectionObserver {
  function mayDispatchSelectionEvent(view: EditorView) {
    if (!view) return

    const { state } = view
    /** Selection must not be empty since we don't want a caret. */
    if (!state.selection.empty && isInlineSelection(state.selection)) {
      const fromRect = view.coordsAtPos(state.selection.from)
      const toRect = view.coordsAtPos(state.selection.to)
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      const selectionBoundingRect = selection
        .getRangeAt(0)
        .getBoundingClientRect()

      onSelectionCreate({
        from: state.selection.from,
        to: state.selection.to,
        fromRect,
        toRect,
        selectionBoundingRect,
      })
    }
  }

  /** EditorView is stable across lifetime. */
  let editorView: EditorView

  function cleanUp() {
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchend', onPointerUp)
    window.removeEventListener('touchcancel', onPointerUp)
  }

  function onPointerUp() {
    mayDispatchSelectionEvent(editorView)
    cleanUp()
  }

  function onPointerDown(view: EditorView): boolean {
    editorView = view

    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)
    window.addEventListener('touchcancel', onPointerUp)

    return false
  }

  return {
    plugin: new Plugin({
      props: {
        handleDOMEvents: {
          mousedown: onPointerDown,
          touchstart: onPointerDown,
          keydown: isMac
            ? (view, e) => {
                if (e.metaKey && e.key === 'a')
                  setTimeout(() => mayDispatchSelectionEvent(view))
                return false
              }
            : (view, e) => {
                if (e.ctrlKey && e.key === 'a')
                  setTimeout(() => mayDispatchSelectionEvent(view))
                return false
              },
        },
      },
      view() {
        return {
          update(view, lastState) {
            /**
             * Selection changeing from non-empty to empty means it's
             * removed.
             */
            if (
              lastState &&
              !lastState.selection.empty &&
              view.state.selection.empty
            ) {
              onSelectionRemove()
            }
          },
          destroy: cleanUp,
        }
      },
    }),
  }
}
