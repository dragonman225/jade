import { stylesheet } from 'typestyle'

import theme from '../../theme'

export const styles = stylesheet({
  Insight: {
    padding: '20px 1rem',
    maxHeight: 500,
    overflow: 'auto',
  },
  InsightItem: {
    position: 'relative',
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.BORDERS.smallRadius,
    transition: 'background 0.1s ease-in-out',
    $nest: {
      '&:hover': {
        background: theme.COLORS.bgHover,
        opacity: 0.9,
      },
      '&:active': {
        background: theme.COLORS.bgActive,
        opacity: 0.8,
      },
    },
  },
  Divider: {
    border: 'none',
    borderBottom: `1px solid ${theme.COLORS.uiGreyLight}`,
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
    color: theme.COLORS.uiGrey,
    $nest: {
      '&:not(:only-child)': {
        marginBottom: '.5rem',
      },
      /* HeaderText */
      '& > div': {
        flex: '1 1 0',
      },
      '& > button': {
        flex: '0 0 1.4rem',
        width: '1.4rem',
        height: '1.4rem',
        outline: 'none',
        border: 'none',
        borderRadius: theme.BORDERS.smallRadius,
        background: theme.COLORS.bgWhite,
        padding: '.15rem',
        transition: 'background 0.1s ease-in-out',
        cursor: 'pointer',
        $nest: {
          '& > svg': {
            fill: theme.COLORS.uiGrey,
          },
        },
      },
      '& > button:hover': {
        background: theme.COLORS.bgHover,
      },
      '& > button:active': {
        background: theme.COLORS.bgActive,
      },
    },
  },
  HeaderText: {
    color: theme.COLORS.uiGrey,
    fontSize: '.8rem',
  },
})
