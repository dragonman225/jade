import { stylesheet } from 'typestyle'
import theme from '../../theme'

export const styles = stylesheet({
  EditorContainer: {
    /** For Placeholder to reference position. */
    position: 'relative',
    $nest: {
      '& .ProseMirror': {
        whiteSpace: 'pre-wrap',
        /**
         * COMPAT (2021/08/20):
         * Chromium adds this prop when contenteditable = true, but removes
         * it when contenteditable = false, making text height changing
         * when there're long words. Adding this prop ensure text always
         * wraps.
         */
        overflowWrap: 'break-word',
        /**
         * Although this is deprecated, this is necessary to make texts
         * wrap in a flex item.
         */
        wordBreak: 'break-word',
      },
      '& .ProseMirror:focus': {
        outline: 'none',
      },
    },
  },
  PMTextNavItem: {
    fontSize: '.8rem',
    padding: theme.paddings.navComfort,
    maxHeight: '100%',
  },
  PMTextBlock: {
    padding: theme.paddings.blockComfort,
  },
  PMTextCardTitle: {
    /** auto vertical center when it is smaller than HeaderTool's content
        min-height. */
    margin: 'auto',
    width: '100%',
  },
  SlashMenu: {
    width: 150,
    padding: '.3rem',
    position: 'absolute',
    zIndex: 10000,
    color: theme.colors.contentText,
    background: theme.colors.bgSecondary,
    boxShadow: theme.shadows.float,
    borderRadius: theme.borders.largeRadius,
    animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
    $nest: {
      '&>p': {
        margin: '.2rem .5rem .5rem',
        fontSize: '.7rem',
        opacity: 0.7,
      },
    },
  },
  SlashMenuItem: {
    padding: '.3rem .5rem',
    borderRadius: theme.borders.smallRadius,
  },
  'SlashMenuItem--Chosen': {
    background: theme.colors.bgHover,
  },
  Placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7,
    pointerEvents: 'none',
  },
  Code: {
    borderRadius: 5,
    backgroundColor: 'rgba(27, 31, 35, 0.05)',
    fontSize: '0.9em',
    padding: '0.2em 0.4em',
    wordBreak: 'break-word',
    fontFamily: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace, Courier`,
  },
  Underline: {
    borderBottom: '0.05em solid',
  },
})
