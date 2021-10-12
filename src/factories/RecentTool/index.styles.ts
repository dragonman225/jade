import { stylesheet } from 'typestyle'
import theme from '../../theme'

export const styles = stylesheet({
  Recent: {
    width: '100%',
    height: 40,
    display: 'flex',
    padding: '0px 20px',
    $nest: {
      '& button': {
        border: 'none',
        background: 'unset',
        lineHeight: 1.3,
      },
      '& button:focus': {
        outline: 'none',
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
    borderRadius: theme.borders.smallRadius,
    cursor: 'pointer',
    color: theme.colors.contentText,
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
        /* flex: '1 0 200px', */
        overflowY: 'scroll',
        paddingRight: 0,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
      '&::-webkit-scrollbar': {
        width: 5,
        backgroundColor: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0, 0, 0, 0.25)',
        $nest: {
          '&:active': {
            background: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
  },
  ContentPreview: {
    pointerEvents: 'none',
    height: '100%',
  },
})
