import theme from './theme'

export const buttonBase = {
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  padding: '.3rem .5rem',
  fontSize: '.875rem',
  lineHeight: '1.25rem',
  transition: 'background 0.1s ease-in-out',
  cursor: 'pointer',
}

export const buttonTransparent = {
  ...buttonBase,
  color: theme.colors.uiBlack,
  background: theme.colors.bgWhite,
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
  color: theme.colors.uiWhite,
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(5px)',
  $nest: {
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.5)',
    },
    '&:active': {
      background: 'rgba(0, 0, 0, 0.65)',
    },
  },
}

export const buttonPrimary = {
  ...buttonBase,
  color: theme.colors.uiWhite,
  background: theme.colors.primary2,
  $nest: {
    '&:hover': {
      background: theme.colors.primary2Hover,
    },
    '&:active': {
      background: theme.colors.primary2Active,
    },
  },
}

export const input = {
  outline: 'none',
  border: 'none',
  borderRadius: theme.borders.smallRadius,
  padding: '.3rem .5rem',
  background: theme.colors.bgGrey,
  lineHeight: 1.25,
}
