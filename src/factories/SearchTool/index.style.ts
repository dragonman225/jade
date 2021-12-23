import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { inputTransparent, buttonTransparent } from '../../lightComponents'

export const styles = stylesheet({
  'Search--Linking': {
    cursor: 'grabbing',
  },
  SearchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.paddings.blockCompact,
  },
  SearchIcon: {
    flex: '0 0 1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    padding: '.2rem',
    marginRight: '.3rem',
    fill: theme.colors.neutral50,
  },
  SearchInput: {
    ...inputTransparent,
    flex: '1 1 0',
    padding: '.1rem',
    fontSize: '.8rem',
    width: '100%',
    color: theme.colors.contentText,
    $nest: {
      '&::placeholder': {
        color: theme.colors.neutral50,
        fontSize: '.8rem',
      },
    },
  },
  SearchShortcutHint: {
    flex: '0 0 4rem',
    height: '1.5rem',
    marginLeft: '.3rem',
    fontSize: '.6rem',
    color: theme.colors.neutral50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ScrollList: {
    height: '100%',
    maxHeight: 500,
    overflow: 'auto',
    paddingLeft: '1.25rem',
    paddingRight: '1.25rem',
  },
  ScrollListItem: {
    maxHeight: 150,
    overflow: 'hidden',
    marginLeft: '-.5rem',
    marginRight: '-.5rem',
    borderRadius: theme.borders.smallRadius,
    transition: `background 50ms ${theme.easings.easeInOutCubic}`,
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
      '&:last-of-type': {
        marginBottom: '.5rem',
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
  VisualCopy: {
    width: 300,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 99999,
  },
  pageControl: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.paddings.blockComfort,
    fontSize: '.8rem',
    textAlign: 'center',
    color: theme.colors.neutral50,
  },
  pageButton: {
    flex: '0 0 50px',
    padding: '.2rem .6rem',
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
  pageInfo: {
    flex: '1 1 0px',
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 .75rem .5rem',
  },
  tabButton: {
    ...buttonTransparent,
    flex: '1 1 0',
    color: theme.colors.neutral60,
    fontSize: '.8rem',
    lineHeight: 1.25,
    padding: '.2rem .6rem',
    marginRight: '.3rem',
    $nest: {
      '&:last-of-type': {
        marginRight: 0,
      },
      ...buttonTransparent.$nest,
    },
  },
  Selected: {
    backgroundColor: theme.colors.bgHover,
  },
  ContentPreview: {
    maxHeight: 'inherit',
    pointerEvents: 'none',
  },
  tabDescription: {
    margin: 0,
    padding: '0 .75rem .75rem',
    color: theme.colors.neutral40,
    fontSize: '.8rem',
    textAlign: 'center',
  },
})
