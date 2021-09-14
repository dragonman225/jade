import { stylesheet } from 'typestyle'

import theme from '../../../theme'

export const styles = stylesheet({
  SuggestionMenu: {
    padding: '.3rem',
    color: theme.colors.contentText,
    background: theme.colors.bgBlock,
    boxShadow: theme.shadows.float,
    borderRadius: theme.borders.largeRadius,
    animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
  },
  OptionGroupTitle: {
    margin: '.2rem .5rem .5rem',
    fontSize: '.7rem',
    opacity: 0.8,
  },
  Option: {
    padding: '.3rem .5rem',
    fontSize: '.875rem',
    borderRadius: theme.borders.smallRadius,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    $nest: {
      '&:active': {
        background: theme.colors.bgActive,
      },
    },
  },
  Selected: {
    background: theme.colors.bgHover,
  },
})
