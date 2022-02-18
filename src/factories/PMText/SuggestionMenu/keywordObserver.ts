import { Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { Command } from 'prosemirror-commands'

import { PMTextSchema } from '../ProseMirrorSchema/schema'

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
  /** The keyword string without the trigger string. */
  keyword: string
  /** A range in absolute index that represents the keyword. */
  keywordRange: KeywordRange
  /** The view coordinates of the keyword. */
  keywordCoords: KeywordCoords
  /** The string that triggers the KeywordEvent. */
  triggerString: string
}

/**
 * Used by commands. Commands work by attaching meta to transactions,
 * which will be intercepted by the plugin.
 */
interface KeywordObserverTransactionMeta {
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

interface KeywordObserverPluginState {
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

interface KeywordObserverPluginOptions {
  rules?: ObserveRule[]
  debug?: boolean
}

export interface KeywordObserver {
  /** A ProseMirror Plugin that need to be inserted into the editor. */
  plugin: Plugin<KeywordObserverPluginState, PMTextSchema>
  /**
   * A ProseMirror Command that can be used to reset the observer's state
   * to stop reporting keyword.
   */
  reset: Command<PMTextSchema>
}

/**
 * Create a KeywordObserver that can be used to monitor text being typed
 * into a ProseMirror editor when a trigger condition (defined by a Regular
 * Expression) is met.
 *
 * This can be an useful building block for slash commands, inline tags,
 * inline mentions.
 *
 * Tip: The KeywordObserver does not have opinions on when it should stop
 * reporting keyword, except for caret being moved out of current keyword
 * context by pointer events or arrow keys. You can define other
 * application-specific logic that stops reporting keyword, e.g. when no
 * match for too many times (Notion's slash commands: no match + keyword
 * length > 9 chars OR no match + `Space` key).
 */
export function createKeywordObserver({
  rules = [],
  debug = false,
}: KeywordObserverPluginOptions): KeywordObserver {
  const pluginKey = new PluginKey<KeywordObserverPluginState, PMTextSchema>(
    'keywordObserver'
  )
  const plugin = new Plugin({
    key: pluginKey,

    view() {
      return {
        update: (view, prevState) => {
          const prevPluginState = pluginKey.getState(prevState)
          const nextPluginState = pluginKey.getState(view.state)

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

          /** Stop if the user runs the "reset" command. */
          const meta = tr.getMeta(pluginKey) as
            | KeywordObserverTransactionMeta
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

        /**
         * Ignore if tr is produced by pointer or paste. Ignore if tr does
         * not change content. To prevent triggering upon focusing in the
         * middle of some text and the text before the caret meets the
         * trigger condition. e.g. putting the caret right after a slash
         * char should not bring up the slash commands menu.
         */
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

          /**
           * Trigger on the first match, changing plugin state to "active"
           * (reporting keyword).
           */
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
      /** Setup decorations on currently active keyword. */
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
  return {
    plugin,
    reset: (state, dispatch) => {
      const pluginState = pluginKey.getState(state)
      if (!pluginState || !pluginState.active) return false
      if (dispatch)
        dispatch(
          state.tr.setMeta(pluginKey, {
            stopReporting: true,
          } as KeywordObserverTransactionMeta) as Transaction<PMTextSchema>
        )
      return true
    },
  }
}

function createResetState(): KeywordObserverPluginState {
  return {
    active: false,
    keywordRange: { from: -1, to: -1 },
    keyword: '',
    triggerPos: -1,
    triggerString: '',
    activeRule: undefined,
  }
}
