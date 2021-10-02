import { stylesheet } from 'typestyle'

import { blockColorMixin } from '../../utils/block'
import theme from '../../../theme'
import { menuListButton, menuPanel, menuTitle } from '../../../lightComponents'

const buttonSize = 1.75
const buttonBase = {
  height: `${buttonSize}rem`,
  fontSize: '0.9rem',
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  color: theme.colors.contentText,
  background: theme.colors.bgBlock,
  cursor: 'pointer',
  transition: `background 30ms ${theme.easings.easeInOutCubic}`,
  $nest: {
    '&:hover': {
      background: theme.colors.bgHover,
    },
    '&:active': {
      background: theme.colors.bgActive,
    },
  },
}

export const styles = stylesheet({
  ContextMenu: {
    ...menuPanel,
    width: `calc(${buttonSize}rem * 6 + 1.1rem)`,
  },
  Title: {
    ...menuTitle,
  },
  TileButtonGroup: {
    padding: '.3rem .25rem',
  },
  TileButton: {
    ...buttonBase,
    padding: '.25rem',
    width: `${buttonSize}rem`,
  },
  ListButton: {
    ...menuListButton,
  },
  ColorTile: {
    width: '100%',
    height: '100%',
    background: theme.colors.bgBlock,
    borderRadius: theme.borders.smallRadius,
    $nest: {
      [`&[data-color="default"]`]: {
        border: `1px solid ${theme.colors.uiGreyLight}`,
      },
      ...blockColorMixin.$nest,
    },
  },
  Danger: {
    color: theme.colors.uiDanger,
    $nest: {
      '&:hover': {
        background: theme.colors.bgDangerHover,
      },
      '&:active': {
        background: theme.colors.bgDangerActive,
      },
    },
  },
  InfoLines: {
    fontSize: '.7rem',
    padding: '.3rem .5rem',
  },
})
