import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { Command } from 'prosemirror-commands'

const keywordObserverKey = new PluginKey<PluginState>('observeKeyword')

function createResetState(): PluginState {
  return {
    active: false,
    keywordRange: { from: -1, to: -1 },
    keyword: '',
    triggerPos: -1,
    triggerString: '',
    activeRule: undefined,
  }
}

type Rect = {
  top: number
  right: number
  bottom: number
  left: number
}

type KeywordRange = {
  from: number
  to: number
}

type KeywordCoords = {
  from: Rect
  to: Rect
}

export interface KeywordEvent {
  /** The keyword string without trigger string. */
  keyword: string
  /** A range in absolute index that represents the keyword. */
  keywordRange: KeywordRange
  /** The view coordinates of the keyword. */
  keywordCoords: KeywordCoords
  /** The string that triggers the start of KeywordEvents. */
  triggerString: string
}

/**
 * Used by commands. Commands work by attaching meta to transactions,
 * which are later intercepted by the plugin.
 */
interface KeywordObserverTrMeta {
  stopReporting: boolean
}

interface ObserveRule {
  keywordDecorationClass?: string
  /** A Regex to trigger keyword reporting. */
  trigger: RegExp
  /**
   * Fires when the trigger is found, and the observer starts reporting the
   * keyword.
   */
  onTrigger?(this: void, event: KeywordEvent): void
  /** Fires when the keyword changes. */
  onKeywordChange?(this: void, event: KeywordEvent): void
  /**
   * Fires when the keyword stops reporting due to some conditions met.
   *
   * `keywordCoords` is omitted since it's impossible to get it if keyword
   * is deleted.
   */
  onKeywordStop?(this: void, event: Omit<KeywordEvent, 'keywordCoords'>): void
}

interface PluginState {
  /** Is reporting keyword or not. */
  active: boolean
  /** The keyword string without trigger string. */
  keyword: string
  /** A range in absolute index that represents the keyword. */
  keywordRange: KeywordRange
  /**
   * The position where a match is found and "active" goes from
   * false to true.
   */
  triggerPos: number
  /**
   * The string that triggers reporting. (Since the trigger is a Regex,
   * which allows specifying multiple strings to trigger the same
   * set of handlers.)
   */
  triggerString: string
  /** The rule that is active. */
  activeRule: ObserveRule | undefined
}

interface PluginOptions {
  rules?: ObserveRule[]
  debug?: boolean
}

/**
 * Legacy notes:
 * idea: On tr that changes doc (prevent trigger on focusing in the
 * middle of text and before the cursor is the trigger string),
 * check if before the cursor is the trigger string,
 * if there is, change state to suggesting, and produce events that reports
 * search text, so the user can show suggestions. When the user does not
 * need suggestions (e.g. no match for too many times), return something
 * in the event handler, so the plugin knows, it changes state to detecting
 * and wait for the next trigger.
 *
 * no result + space, or no result + total length > 9 => close menu
 */
/**
 * Report text being typed after a trigger condition (defined by a Regex).
 *
 * A useful building block for slash commands, inline tags, inline mentions.
 * 
 * {
      debug = false,
      keywordDecorationClass = 'ProseMirrorKeyword',
      trigger = /@$/,
      onTrigger = noop,
      onKeywordChange = noop,
      onKeywordStop = noop,
    }
 */
export function observeKeyword({
  rules = [],
  debug = false,
}: PluginOptions): Plugin<PluginState> {
  return new Plugin({
    key: keywordObserverKey,

    view() {
      return {
        update: (view, prevState) => {
          const key = this.key as PluginKey<PluginState, any>
          const prevPluginState = key.getState(prevState)
          const nextPluginState = key.getState(view.state)

          if (!prevPluginState || !nextPluginState) return

          // See how the state changed
          const moved =
            prevPluginState.active &&
            nextPluginState.active &&
            prevPluginState.keywordRange.from !==
              nextPluginState.keywordRange.from
          const started = !prevPluginState.active && nextPluginState.active
          const stopped = prevPluginState.active && !nextPluginState.active
          const changed =
            !started &&
            !stopped &&
            prevPluginState.keyword !== nextPluginState.keyword

          // Trigger the hooks when necessary
          if (stopped || moved) {
            const hookFn = prevPluginState.activeRule?.onKeywordStop
            hookFn &&
              hookFn({
                keyword: prevPluginState.keyword,
                keywordRange: prevPluginState.keywordRange,
                triggerString: prevPluginState.triggerString,
              })
          }
          if (changed && !moved) {
            const hookFn = nextPluginState.activeRule?.onKeywordChange
            hookFn &&
              hookFn({
                keyword: nextPluginState.keyword,
                keywordRange: nextPluginState.keywordRange,
                keywordCoords: {
                  from: view.coordsAtPos(nextPluginState.keywordRange.from),
                  to: view.coordsAtPos(nextPluginState.keywordRange.to),
                },
                triggerString: nextPluginState.triggerString,
              })
          }
          if (started || moved) {
            const hookFn = nextPluginState.activeRule?.onTrigger
            hookFn &&
              hookFn({
                keyword: nextPluginState.keyword,
                keywordRange: nextPluginState.keywordRange,
                keywordCoords: {
                  from: view.coordsAtPos(nextPluginState.keywordRange.from),
                  to: view.coordsAtPos(nextPluginState.keywordRange.to),
                },
                triggerString: nextPluginState.triggerString,
              })
          }
        },
      }
    },

    state: {
      /** Initialize the plugin's internal state. */
      init() {
        return createResetState()
      },

      /** Apply changes to the plugin state from a transaction. */
      apply(tr, state) {
        const { selection } = tr

        if (state.active) {
          /** The observer is reporting keyword. */

          /** Stop if seeing a pointer action. */
          if (tr.getMeta('pointer')) {
            return createResetState()
          }

          /** Stop if caret is moved before the trigger position. */
          if (
            selection.from === selection.to &&
            selection.from < state.triggerPos
          ) {
            return createResetState()
          }

          /** Stop if the user runs the `resetKeywordObserver` command. */
          const meta = tr.getMeta(keywordObserverKey) as
            | KeywordObserverTrMeta
            | undefined
          if (meta && meta.stopReporting) {
            return createResetState()
          }

          const caretPos = selection.from
          const $caretPos = selection.$from
          const text = $caretPos.doc.textBetween(
            state.triggerPos,
            caretPos,
            '\0',
            '\0'
          )

          return {
            ...state,
            keywordRange: { from: state.triggerPos, to: caretPos },
            keyword: text,
          }
        }

        /** The observer is waiting to be triggered. */

        /* Ignore if tr is produced by pointer or paste, or tr does not
             change content. */
        if (tr.getMeta('pointer') || tr.getMeta('uiEvent') || !tr.docChanged)
          return { ...state }

        /** Ignore if selection is a range, not a cursor. */
        if (selection.from !== selection.to) return { ...state }

        /** Useful data: caret position. */
        const caretPos = selection.from
        const $caretPos = selection.$from
        /** Useful data: Start and end index of the node that the caret is in. */
        const nodeStart = $caretPos.start()
        const nodeEnd = $caretPos.end()

        /**
         * Ignore deletion. e.g. Pressing backspace and the caret
         * position happens to satisfy the matcher.
         */
        if (tr.steps && tr.steps[0]) {
          const step = tr.steps[0] // When does a tr have multiple steps?
          const stepMap = step.getMap()
          let trHasDeletion = false
          stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
            if (newStart >= nodeStart && newEnd <= nodeEnd) {
              /** The change happens in the node that caret is in. */
              if (oldEnd - oldStart !== 0 && newEnd === newStart)
                trHasDeletion = true
            }
          })
          if (trHasDeletion) return { ...state }
        }

        /** Match against the caret. */
        const textBeforeCaret = $caretPos.doc.textBetween(
          nodeStart,
          caretPos,
          '\0',
          '\0'
        )

        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i]
          const match = rule.trigger.exec(textBeforeCaret)

          /** Trigger on the first match. */
          if (match) {
            return {
              active: true,
              keywordRange: { from: caretPos, to: caretPos },
              keyword: '',
              triggerPos: caretPos,
              triggerString: match[0],
              activeRule: rule,
            }
          }
        }

        /** No trigger match. */
        return { ...state }
      },
    },

    props: {
      /**
       * Call the keydown hook if keyword is active.
       */
      // handleKeyDown(view, event) {
      //   const { active } = this.getState(view.state)

      //   if (!active) return false

      //   return onKeyDown({ view, event })
      // },

      /**
       * Setup decorations on currently active keyword.
       */
      decorations(state) {
        const { active, activeRule, keywordRange: range } = this.getState(state)

        if (!active || !activeRule) return null

        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: 'span',
            class: activeRule.keywordDecorationClass || 'ProseMirrorKeyword',
            style: debug
              ? `background: rgba(5, 12, 156, 0.05);
                 color: #050c9c;
                 border: 2px solid #050c9c;`
              : null,
          }),
        ])
      },
    },
  })
}

/**
 * A command that can be used to reset the observer state and stop
 * reporting keyword.
 */
export const resetKeywordObserver: Command = (state, dispatch) => {
  const pluginState = keywordObserverKey.getState(state)
  if (!pluginState || !pluginState.active) return false
  if (dispatch)
    dispatch(
      state.tr.setMeta(keywordObserverKey, {
        stopReporting: true,
      } as KeywordObserverTrMeta)
    )
  return true
}
