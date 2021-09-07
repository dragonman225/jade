import { stylesheet } from 'typestyle'

import theme from '../../theme'

const buttonSize = 1.7
const menuPaddingSize = 0.3
const highlightPickerWidth = buttonSize * 6 + menuPaddingSize * 2
const highlightPickerLeft =
  buttonSize * 5.5 + menuPaddingSize - highlightPickerWidth / 2
const menu = {
  padding: `${menuPaddingSize}rem`,
  zIndex: 10000,
  background: theme.colors.bgSecondary,
  boxShadow: theme.shadows.float,
  borderRadius: theme.borders.smallRadius,
  animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
}

export const styles = stylesheet({
  TextActionMenu: { ...menu, display: 'flex' },
  Button: {
    padding: 0,
    width: `${buttonSize}rem`,
    height: `${buttonSize}rem`,
    fontSize: '0.9rem',
    outline: 'none',
    border: 'none',
    borderRadius: theme.borders.smallRadius,
    color: theme.colors.contentText,
    background: theme.colors.bgSecondary,
    cursor: 'pointer',
    transition: `background 0.1s ${theme.easings.easeInOutCubic}`,
    $nest: {
      '&:hover': {
        background: theme.colors.bgHover,
      },
      '&:active': {
        background: theme.colors.bgActive,
      },
    },
  },
  ButtonSelected: {
    color: theme.colors.uiPrimary,
  },
  HighlightPicker: {
    ...menu,
    position: 'absolute',
    top: '-9rem',
    left: `${highlightPickerLeft}rem`,
    width: `${highlightPickerWidth}rem`,
  },
  Label: {
    fontSize: '.7rem',
    padding: '.2rem',
    color: theme.colors.uiGrey,
  },
})
