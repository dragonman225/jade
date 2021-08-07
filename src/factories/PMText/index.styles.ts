import { stylesheet } from 'typestyle'
import theme from '../../theme'

export const styles = stylesheet({
  EditorContainer: {
    /** For Placeholder to reference position. */
    position: 'relative',
    $nest: {
      '& .ProseMirror': {
        whiteSpace: 'pre-wrap',
      },
      '& .ProseMirror:focus': {
        outline: 'none',
      },
    },
  },
  PMTextNavItem: {
    fontSize: '.8rem',
    padding: '.5rem',
    maxHeight: '100%',
  },
  PMTextBlock: {
    padding: '0.5rem 1.25rem',
  },
  PMTextCardTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    padding: '.3rem .5rem',
    /** auto vertical center when it is smaller than HeaderTool's content 
        min-height. */
    margin: 'auto',
    overflow: 'auto',
    width: '100%',
  },
  SlashMenu: {
    width: 150,
    padding: '.3rem',
    position: 'absolute',
    zIndex: 10000,
    background: '#fff',
    boxShadow: theme.SHADOWS.float,
    borderRadius: theme.BORDERS.largeRadius,
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
    borderRadius: theme.BORDERS.smallRadius,
  },
  'SlashMenuItem--Chosen': {
    background: theme.COLORS.bgHover,
  },
  Placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.7,
    pointerEvents: 'none',
  },
})
