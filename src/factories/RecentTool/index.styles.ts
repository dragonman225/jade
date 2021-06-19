import { stylesheet } from 'typestyle'
import theme from '../../theme'

export const styles = stylesheet({
  Recent: {
    width: '100%',
    height: 50,
    display: 'flex',
    padding: '0px 20px',
    $nest: {
      '& button': {
        border: 'none',
        background: 'unset',
      },
      '& button:focus': {
        outline: 'none',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555',
      },
    },
  },
  RecentBtn: {
    flex: '1 0 75px',
    maxWidth: 300,
    height: '100%',
    overflow: 'hidden',
    transition: 'background 0.2s, flex-basis 0.3s',
    padding: '0 5px',
    borderRadius: theme.BORDERS.smallRadius,
    $nest: {
      '&:hover': {
        background: 'var(--bg-hover)',
        /* flex: '1 0 200px', */
        overflowY: 'scroll',
        paddingRight: 0,
      },
      '&:active': {
        background: 'var(--bg-hover)',
      },
      '&::-webkit-scrollbar': {
        width: 5,
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
      },
    },
  },
})
