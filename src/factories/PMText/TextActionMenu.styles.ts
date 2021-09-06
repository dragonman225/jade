import { stylesheet } from 'typestyle'

import theme from '../../theme'

export const styles = stylesheet({
  TextActionMenu: {
    display: 'flex',
    padding: '.3rem',
    zIndex: 10000,
    background: theme.colors.bgSecondary,
    boxShadow: theme.shadows.float,
    borderRadius: theme.borders.smallRadius,
    animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
  },
  Button: {
    padding: 0,
    width: '1.7rem',
    height: '1.7rem',
    fontSize: '0.9rem',
    outline: 'none',
    border: 'none',
    borderRadius: theme.borders.smallRadius,
    color: theme.colors.contentText,
    background: theme.colors.bgSecondary,
    cursor: 'pointer',
    transition: `background 0.1s ${theme.easings.easeInOutCubic}`,
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
    },
  },
  ButtonSelected: {
    color: theme.colors.uiPrimary,
  },
})
