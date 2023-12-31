import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { buttonTransparent } from '../../lightComponents'

export const styles = stylesheet({
  Insight: {
    padding: theme.paddings.blockComfort,
    maxHeight: 500,
    overflow: 'auto',
  },
  InsightItem: {
    position: 'relative',
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.borders.smallRadius,
    transition: 'background 0.1s ease-in-out',
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
        opacity: 0.9,
      },
      '&:active': {
        background: theme.colors.bgActive,
        opacity: 0.8,
      },
    },
  },
  Divider: {
    border: 'none',
    borderBottom: `1px solid ${theme.colors.neutral90}`,
    $nest: {
      '&:last-of-type': {
        display: 'none',
      },
    },
  },
  Header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors.neutral50,
    $nest: {
      '&:not(:only-child)': {
        marginBottom: '.5rem',
      },
      /* HeaderText */
      '& > div': {
        flex: '1 1 0',
      },
      '& > button': {
        ...buttonTransparent,
        flex: '0 0 1.4rem',
        width: '1.4rem',
        height: '1.4rem',
        padding: '.15rem',
        $nest: {
          ...buttonTransparent.$nest,
          '& > svg': {
            fill: theme.colors.neutral50,
          },
        },
      },
    },
  },
  HeaderText: {
    color: theme.colors.neutral50,
    fontSize: '.8rem',
  },
})
