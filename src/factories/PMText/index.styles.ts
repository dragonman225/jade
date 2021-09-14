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
