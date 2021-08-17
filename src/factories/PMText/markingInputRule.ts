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
      let marks: Mark[] = []
      if (Array.isArray(markTypeOrMarkTypes)) {
        const markTypes = markTypeOrMarkTypes
        marks = markTypes.map(mt => mt.create())
      } else {
        const markType = markTypeOrMarkTypes
        marks = [markType.create()]
      }

      const textNode = state.schema.text(match[1], marks)
      let tr = state.tr.replaceRangeWith(start, end, textNode)
      marks.forEach(m => {
        tr = tr.removeStoredMark(m) as Transaction<Schema>
      })
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
}
