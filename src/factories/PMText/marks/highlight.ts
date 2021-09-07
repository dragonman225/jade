import { stylesheet } from 'typestyle'
import { MarkSpec, Mark, ParseRule } from 'prosemirror-model'

import theme from '../../../theme'
import { NestedCSSProperties } from 'typestyle/lib/types'

/** Better types. */
export interface HighlightMark extends Mark {
  attrs: { color: HighlightColor }
}

interface HighlightParseRule extends ParseRule {
  getAttrs: (el: Element) => HighlightMark['attrs']
}

interface HighlightMarkSpec extends MarkSpec {
  attrs: { color: { default: string } }
  toDOM: (
    mark: HighlightMark
  ) => [
    string,
    { 'data-color': string } & { [attr: string]: string | null | undefined },
    0
  ]
  parseDOM: HighlightParseRule[]
}

/** Supported colors. */
export enum HighlightColor {
  BackgroundRed = 'background-red',
  BackgroundOrange = 'background-orange',
  BackgroundYellow = 'background-yellow',
  BackgroundGreen = 'background-green',
  BackgroundBlue = 'background-blue',
  BackgroundPurple = 'background-purple',
  BluePurpleGradient = 'blue-purple-gradient',
  OrangePinkGradient = 'orange-pink-gradient',
}

/** Styles for highlight. */
const gradientBase = {
  '-webkit-background-clip': 'text',
  '-webkit-box-decoration-break': 'clone',
  color: 'transparent',
  backgroundClip: 'text',
} as NestedCSSProperties

export const styles = stylesheet({
  Highlight: {
    background: 'transparent',
    borderRadius: theme.borders.smallRadius,
    $nest: {
      [`&[data-color="${HighlightColor.BackgroundRed}"]`]: {
        background: '#ffa8a8',
      },
      [`&[data-color="${HighlightColor.BackgroundOrange}"]`]: {
        background: '#ffc078',
      },
      [`&[data-color="${HighlightColor.BackgroundYellow}"]`]: {
        background: '#ffe066',
      },
      [`&[data-color="${HighlightColor.BackgroundGreen}"]`]: {
        background: '#8ce99a',
      },
      [`&[data-color="${HighlightColor.BackgroundBlue}"]`]: {
        background: '#74c0fc',
      },
      [`&[data-color="${HighlightColor.BackgroundPurple}"]`]: {
        background: '#b197fc',
      },
      /**
       * Gradient colors from Craft
       * @see https://www.craft.do/whats-new/b/2BB73298-D459-43A3-B982-1E2CD734A995/v1.2_-_New_highlight_options__PDF
       */
      [`&[data-color="${HighlightColor.BluePurpleGradient}"]`]: {
        ...gradientBase,
        backgroundImage:
          'linear-gradient(90deg, rgb(40, 188, 190) 0%, rgb(57, 53, 221) 100%)',
      },
      [`&[data-color="${HighlightColor.OrangePinkGradient}"]`]: {
        ...gradientBase,
        backgroundImage:
          'linear-gradient(90deg, rgb(255, 107, 0) 0%, rgb(255, 0, 162) 100%)',
      },
    },
  },
})

/** MarkSpec for highlight. */
export const highlightMarkName = 'highlight'
export const highlightMarkSpec = {
  attrs: {
    color: {
      default: HighlightColor.BackgroundYellow,
    },
  },
  toDOM(mark) {
    const { color } = mark.attrs
    return ['mark', { class: styles.Highlight, 'data-color': color }, 0]
  },
  parseDOM: [
    {
      tag: 'mark',
      getAttrs(dom) {
        return { color: dom.getAttribute('data-color') }
      },
    },
  ],
} as HighlightMarkSpec

/** Utils. */
export function isBackgroundHighlight(value: HighlightColor): boolean {
  return value.startsWith('background')
}

export function isColorHighlight(value: HighlightColor): boolean {
  return !value.startsWith('background')
}
