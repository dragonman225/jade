import { NestedCSSProperties } from 'typestyle/lib/types'

import theme from './theme'

export const buttonBase = {
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  padding: '.3rem .5rem',
  fontSize: '.875rem',
  lineHeight: '1.25rem',
  transition: 'background 30ms ease-in-out',
  cursor: 'pointer',
}

export const buttonTransparent = {
  ...buttonBase,
  color: theme.colors.uiText,
  background: 'transparent',
  $nest: {
    '&:hover': {
      background: theme.colors.bgHover,
    },
    '&:active': {
      background: theme.colors.bgActive,
    },
  },
}

export const buttonTranslucent = {
  ...buttonBase,
  color: theme.colors.neutral90,
  /** neutral10 */
  background: 'rgba(25, 25, 24, 0.75)',
  // backdropFilter: 'blur(5px)',
  $nest: {
    '&:hover': {
      background: 'rgba(25, 25, 24, 0.85)',
    },
    '&:active': {
      background: 'rgba(25, 25, 24, 0.95)',
    },
  },
}

export const buttonPrimary = {
  ...buttonBase,
  color: theme.colors.uiText,
  background: theme.colors.uiPrimaryAttractive,
  $nest: {
    '&:hover': {
      background: theme.colors.uiPrimaryAttractiveHover,
    },
    '&:active': {
      background: theme.colors.uiPrimaryAttractiveActive,
    },
  },
}

export const input = {
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  padding: '.3rem .5rem',
  background: theme.colors.neutral95,
  lineHeight: 'normal',
}

export const inputTransparent = {
  ...input,
  background: 'transparent',
}

export const textOverflowEllipsis = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

export const navBasic = {
  padding: theme.paddings.navComfort,
  fontSize: '.8rem',
}

export const menuPanel = {
  padding: '.3rem',
  color: theme.colors.contentText,
  background: theme.colors.bgBlock,
  boxShadow: theme.shadows.float,
  borderRadius: theme.borders.smallRadius,
  animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
}

export const menuTitle = {
  padding: '.3rem .5rem',
  fontSize: '.7rem',
  color: theme.colors.neutral50,
}

export const menuListButton: NestedCSSProperties = {
  ...buttonTransparent,
  color: theme.colors.contentText,
  width: '100%',
  padding: '.25rem .5rem',
  fontSize: '.875rem',
  textAlign: 'left',
  borderRadius: theme.borders.smallRadius,
  cursor: 'pointer',
}
