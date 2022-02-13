import { Mark, MarkType, Schema } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import { InputRule } from 'prosemirror-inputrules'

/**
 * Build an input rule for automatically marking a string when a given
 * pattern is typed.
 *
 * References:
 * https://github.com/benrbray/prosemirror-math/blob/master/src/plugins/math-inputrules.ts
 * https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rulebuilders.js
 */
export function markingInputRule(
  pattern: RegExp,
  markTypeOrMarkTypes: MarkType | MarkType[]
): InputRule {
  return new InputRule(
    pattern,
    (state: EditorState<Schema>, match, start, end) => {
      let marks: Mark<Schema>[] = []
      if (Array.isArray(markTypeOrMarkTypes)) {
        const markTypes = markTypeOrMarkTypes
        marks = markTypes.map(mt => mt.create() as Mark<Schema>)
      } else {
        const markType = markTypeOrMarkTypes
        marks = [markType.create() as Mark<Schema>]
      }

      /**
       * Get markup tokens, note that left and right may not be the same
       * or have the same length.
       */
      const [tokenLeft, tokenRight] = match[0].split(match[1])
      let tr = state.tr
      /** Add marks. */
      marks.forEach(m => {
        tr = tr.addMark(start, end, m)
      })
      /** Delete tokenLeft. */
      tr = tr.delete(start, start + tokenLeft.length)
      /**
       * Delete tokenRight, since the previous delete changes the
       * positions, we need to "map" them to the new ones.
       */
      tr = tr.delete(
        tr.mapping.map(end - (tokenRight.length - 1)),
        tr.mapping.map(end)
      )
      /**
       * Remove storedMarks, since my experience is that whenever I use
       * InputRule to mark a text, I just want to mark it, but not continue
       * to type with the marks.
       */
      tr = tr.setStoredMarks([]) as Transaction<Schema>
      return tr
    }
  )
}

export const markingPatterns = {
  BoldAndItalicWithTripleStars: /(?<=[^*\n]|^)\*\*\*([^*\n]+)\*\*\*$/,
  BoldWithDoubleStars: /(?<=[^*\n]|^)\*\*([^*\n]+)\*\*$/,
  BoldWithDoubleUnderscores: /(?<=[^_\n]|^)__([^_\n]+)__$/,
  ItalicWithSingleStar: /(?<=[^*\n]|^)\*([^*\n]+)\*$/,
  ItalicWithSingleUnderscore: /(?<=[^_\n]|^)_([^_\n]+)_$/,
  CodeWithSingleBacktick: /`(.+)`$/,
  StrikeWithDoubleTilde: /~~(.+)~~$/,
}
