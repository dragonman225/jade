import { stylesheet } from 'typestyle'

import { blockColorMixin } from '../utils/block'
import theme from '../../theme'

export const styles = stylesheet({
  Block: {
    background: theme.colors.bgBlock,
    borderRadius: theme.borders.smallRadius,
    overflow: 'hidden',
    /**
     * Set `position: relative` so that children with `position: absolute`
     * obey `overflow: hidden` set above.
     */
    position: 'relative',
    // animation: `${theme.animations.fadeIn} 0.2s ${theme.easings.easeInOutCubic}`,
    transition: `opacity 0.1s ${theme.easings.easeInOutCubic}`,
    $nest: {
      ...blockColorMixin.$nest,
      '&:hover': {
        cursor: 'pointer',
      },
      '& > .ActionBtn': {
        opacity: 0,
        transition: `100ms opacity ease-in-out, 30ms fill ${theme.easings.easeInOutCubic}`,
        fill: 'rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        borderRadius: theme.borders.smallRadius,
        $nest: {
          '&:hover': {
            fill: 'rgba(0, 0, 0, 0.7)',
            background: theme.colors.bgHover,
          },
          '&:active': {
            fill: 'rgba(0, 0, 0, 0.9)',
            background: theme.colors.bgActive,
          },
        },
      },
      '&:hover > .ActionBtn': {
        opacity: 1,
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
        transition: `0.1s opacity ${theme.easings.easeInOutCubic}`,
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
    boxShadow: `0px 0px 1px 2px ${theme.colors.contentText}`,
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
