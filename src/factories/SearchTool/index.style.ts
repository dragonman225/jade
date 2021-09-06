import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { inputTransparent } from '../../lightComponents'

export const styles = stylesheet({
  'Search--Linking': {
    cursor: 'grabbing',
  },
  SearchInput: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.paddings.blockComfort,
    $nest: {
      '&>input': {
        ...inputTransparent,
        width: '100%',
        padding: '.1rem',
        fontSize: '.8rem',
      },
      '&>input::placeholder': {
        color: theme.colors.uiGrey,
        fontSize: '.8rem',
      },
    },
  },
  ScrollList: {
    height: '100%',
    maxHeight: 500,
    overflow: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
  ScrollListItem: {
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.borders.smallRadius,
    transition: 'background 0.1s ease-in-out',
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
      '&:first-of-type': {
        marginTop: '.5rem',
      },
      '&:last-of-type': {
        marginBottom: '.5rem',
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
  VisualCopy: {
    width: 300,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 99999,
  },
  Pager: {
    display: 'flex',
    padding: '.5rem 1rem',
    fontSize: '.8rem',
    textAlign: 'center',
    color: theme.colors.uiGrey,
  },
  Arrow: {
    flex: '0 0 50px',
    padding: '0px 3px',
    borderRadius: theme.borders.smallRadius,
    transition: 'background 0.1s ease-in-out',
    cursor: 'pointer',
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
    },
  },
  Info: {
    flex: '1 1 0px',
  },
})
