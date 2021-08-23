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

export interface Options {
  onSelectionCreate?: (event: SelectionEvent) => void
  onSelectionRemove?: () => void
}

export function observeInlineSelection({
  onSelectionCreate = noop,
  onSelectionRemove = noop,
}: Options = {}): Plugin {
  let setupComplete = false
  let editorView: EditorView = undefined

  function mayDispatchSelectionEvent() {
    const { state } = editorView
    /** Selection must not be empty since we don't want a caret. */
    if (!state.selection.empty && isInlineSelection(state.selection)) {
      const fromRect = editorView.coordsAtPos(state.selection.from)
      const toRect = editorView.coordsAtPos(state.selection.to)
      const selectionBoundingRect = window
        .getSelection()
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

  return new Plugin({
    view() {
      return {
        update(view, lastState) {
          if (!setupComplete) {
            /**
             * Initialize the pointer to view, so that event listeners can
             * access view.
             */
            editorView = view
            /** Selection may be created on mouseup. */
            document.addEventListener('mouseup', mayDispatchSelectionEvent)
            /** Selection may be created on `Ctrl/Cmd` + `a`. */
            document.addEventListener(
              'keydown',
              isMac
                ? e => {
                    if (e.metaKey && e.key === 'a') mayDispatchSelectionEvent()
                  }
                : e => {
                    if (e.ctrlKey && e.key === 'a') mayDispatchSelectionEvent()
                  }
            )
            setupComplete = true
          }

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
        destroy() {
          document.removeEventListener('mouseup', mayDispatchSelectionEvent)
          document.removeEventListener('keydown', mayDispatchSelectionEvent)
        },
      }
    },
  })
}
