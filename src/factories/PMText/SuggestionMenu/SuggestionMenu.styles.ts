import { stylesheet } from 'typestyle'

import theme from '../../../theme'
import { menuPanel, menuTitle } from '../../../lightComponents'

export const styles = stylesheet({
  SuggestionMenu: {
    ...menuPanel,
  },
  OptionGroupTitle: {
    ...menuTitle,
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
