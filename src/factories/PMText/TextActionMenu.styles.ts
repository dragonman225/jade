import { stylesheet } from 'typestyle'

import theme from '../../theme'

export const styles = stylesheet({
  TextActionMenu: {
    display: 'flex',
    padding: '.3rem',
    zIndex: 10000,
    background: theme.COLORS.bgWhite,
    boxShadow: theme.SHADOWS.float,
    borderRadius: theme.BORDERS.smallRadius,
    animation: `${theme.ANIMATIONS.fadeIn} 200ms ${theme.EASINGS.easeInOutCubic}`,
  },
  Button: {
    padding: 0,
    width: '1.5rem',
    height: '1.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    border: 'none',
    borderRadius: theme.BORDERS.smallRadius,
    color: theme.COLORS.uiBlack,
    background: theme.COLORS.bgWhite,
    cursor: 'pointer',
    transition: `background 0.1s ${theme.EASINGS.easeInOutCubic}`,
    $nest: {
      '&:hover': {
        background: theme.COLORS.bgHover,
      },
      '&:active': {
        background: theme.COLORS.bgActive,
      },
    },
  },
  ButtonSelected: {
    color: theme.COLORS.uiPrimary,
  },
})
