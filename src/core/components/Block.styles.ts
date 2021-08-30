import { stylesheet } from 'typestyle'

import theme from '../../theme'

export const styles = stylesheet({
  Block: {
    background: 'white',
    borderRadius: theme.borders.smallRadius,
    overflow: 'hidden',
    /**
     * Set `position: relative` so that children with `position: absolute`
     * obey `overflow: hidden` set above.
     */
    position: 'relative',
    animation: `${theme.animations.fadeIn} 200ms ${theme.easings.easeInOutCubic}`,
    $nest: {
      '&:hover': {
        cursor: 'pointer',
      },
      '& > .ActionBtn': {
        opacity: 0,
        transition: '0.1s opacity ease-in-out, 0.1s fill ease-in-out',
        fill: 'silver',
        cursor: 'pointer',
        borderRadius: theme.borders.smallRadius,
        $nest: {
          '&:hover': {
            background: theme.colors.bgHover,
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
        background: theme.colors.uiPrimary,
        opacity: 1,
        transition: '0.1s opacity ease-in-out',
      },
      '&:hover > .Blink': {
        opacity: 0,
      },
    },
  },
  'Block--Selected': {
    boxShadow: `0px 0px 1px 2px ${theme.colors.uiPrimary}`,
  },
  'Block--Focusing': {
    boxShadow: `0px 0px 1px 2px ${theme.colors.uiBlack}`,
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
    background: theme.colors.uiPrimaryVeryLight,
    overflow: 'hidden',
  },
})
