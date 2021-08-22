import { stylesheet, keyframes } from 'typestyle'

import theme from '../../theme'

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
})

export const styles = stylesheet({
  Block: {
    background: 'white',
    borderRadius: theme.BORDERS.smallRadius,
    overflow: 'hidden',
    /**
     * Set `position: relative` so that children with `position: absolute`
     * obey `overflow: hidden` set above.
     */
    position: 'relative',
    animation: `${fadeIn} 200ms ease-in-out`,
    $nest: {
      '&:hover': {
        cursor: 'pointer',
      },
      '& > .ActionBtn': {
        opacity: 0,
        transition: '0.1s opacity ease-in-out, 0.1s fill ease-in-out',
        fill: 'silver',
        cursor: 'pointer',
        borderRadius: theme.BORDERS.smallRadius,
        $nest: {
          '&:hover': {
            background: theme.COLORS.bgHover,
          },
        },
      },
      '&:hover > .ActionBtn': {
        opacity: 1,
      },
      '& > .ActionBtn--Red:hover': {
        fill: 'lightcoral',
      },
      '& > .ActionBtn--Green:hover': {
        fill: 'mediumaquamarine',
      },
      '& > .Blink': {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 4,
        height: 4,
        margin: 8,
        borderRadius: '100%',
        background: theme.COLORS.uiPrimary,
        opacity: 1,
        transition: '0.1s opacity ease-in-out',
      },
      '&:hover > .Blink': {
        opacity: 0,
      },
    },
  },
  'Block--Selected': {
    boxShadow: `0px 0px 0px 2px ${theme.COLORS.uiPrimary}`,
  },
  'Block--Focusing': {
    boxShadow: `0px 0px 0px 2px ${theme.COLORS.uiBlack}`,
    $nest: {
      '&:hover': {
        cursor: 'auto',
      },
    },
  },
  'Block--Moving': {
    opacity: 0.4,
    $nest: {
      '&:hover': {
        cursor: 'grabbing',
      },
    },
  },
  HighlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: theme.COLORS.uiPrimaryVeryLight,
    overflow: 'hidden',
  },
})
