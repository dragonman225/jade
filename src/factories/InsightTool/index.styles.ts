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
    borderBottom: `1px solid ${theme.colors.uiGreyLight}`,
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
    color: theme.colors.uiGrey,
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
        borderRadius: theme.borders.smallRadius,
        background: theme.colors.bgWhite,
        padding: '.15rem',
        transition: 'background 0.1s ease-in-out',
        cursor: 'pointer',
        $nest: {
          '& > svg': {
            fill: theme.colors.uiGrey,
          },
        },
      },
      '& > button:hover': {
        background: theme.colors.bgHover,
      },
      '& > button:active': {
        background: theme.colors.bgActive,
      },
    },
  },
  HeaderText: {
    color: theme.colors.uiGrey,
    fontSize: '.8rem',
  },
})
