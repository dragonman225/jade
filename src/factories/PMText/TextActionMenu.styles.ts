import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { buttonPrimary, input } from '../../lightComponents'

const buttonSize = 1.7
const menuPaddingSize = 0.3
const highlightPickerWidth = buttonSize * 6 + menuPaddingSize * 2
const highlightPickerLeft =
  buttonSize * 5.5 + menuPaddingSize - highlightPickerWidth / 2
const menuBase = {
  padding: `${menuPaddingSize}rem`,
  zIndex: 10000,
  background: theme.colors.bgSecondary,
  boxShadow: theme.shadows.float,
  borderRadius: theme.borders.smallRadius,
  animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
}
const buttonBase = {
  height: `${buttonSize}rem`,
  fontSize: '0.9rem',
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  color: theme.colors.contentText,
  background: theme.colors.bgSecondary,
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
  Button: {
    ...buttonBase,
    padding: 0,
    width: `${buttonSize}rem`,
  },
  TextButton: {
    ...buttonBase,
    padding: '0 .4rem',
  },
  Glow: {
    color: theme.colors.uiPrimary,
  },
  TextActionMenu: { ...menuBase, display: 'flex' },
  HighlightPicker: {
    ...menuBase,
    position: 'absolute',
    top: '-9rem',
    left: `${highlightPickerLeft}rem`,
    width: `${highlightPickerWidth}rem`,
  },
  LinkDialog: {
    ...menuBase,
    position: 'absolute',
    top: '-2.7rem',
    left: '-1.5rem',
    right: '-1.5rem',
    display: 'flex',
    $nest: {
      '& > input': {
        ...input,
        flex: '1 1 0',
        fontSize: '.9rem',
        marginRight: '.3rem',
      },
      '& > button': {
        ...buttonPrimary,
        flex: '0 0 3rem',
        padding: '0 .5rem',
      },
    },
  },
  Label: {
    fontSize: '.7rem',
    padding: '.2rem',
    color: theme.colors.uiGrey,
  },
})
