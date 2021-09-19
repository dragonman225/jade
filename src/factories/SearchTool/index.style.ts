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
    fill: theme.colors.uiGrey,
  },
  SearchInput: {
    ...inputTransparent,
    flex: '1 1 0',
    padding: '.1rem',
    fontSize: '.8rem',
    width: '100%',
    $nest: {
      '&::placeholder': {
        color: theme.colors.uiGrey,
        fontSize: '.8rem',
      },
    },
  },
  SearchShortcutHint: {
    flex: '0 0 1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    padding: '.2rem',
    marginLeft: '.3rem',
    $nest: {
      '& > svg': {
        fill: 'none',
        stroke: theme.colors.uiGrey,
      },
    },
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
  PageBar: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.paddings.blockComfort,
    fontSize: '.8rem',
    textAlign: 'center',
    color: theme.colors.uiGrey,
  },
  Arrow: {
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
  Info: {
    flex: '1 1 0px',
  },
  Tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 .75rem .5rem',
  },
  TabButton: {
    ...buttonTransparent,
    flex: '1 1 0',
    color: theme.colors.uiGrey,
    fontSize: '.8rem',
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
})
