import { stylesheet } from 'typestyle'

import { blockColorMixin } from '../utils/block'
import theme from '../../theme'

const iconSize = 18

const atoms = stylesheet({
  actionButton: {
    transition: `0.1s opacity ${theme.easings.easeInOutCubic}, 30ms fill ${theme.easings.easeInOutCubic}`,
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
  blink: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: 4,
    margin: 8,
    borderRadius: '100%',
    background: theme.colors.uiPrimary,
    transition: `0.1s opacity ${theme.easings.easeInOutCubic}`,
  },
})

export const styles = {
  ...stylesheet({
    block: {
      color: theme.colors.contentText,
      background: theme.colors.bgBlock,
      borderRadius: theme.borders.smallRadius,
      overflow: 'hidden',
      /**
       * Set `position: relative` so that children with `position: absolute`
       * obey `overflow: hidden` set above.
       */
      position: 'relative',
      // animation: `${theme.animations.fadeIn} 0.2s ${theme.easings.easeInOutCubic}`,
      transition: `opacity 0.1s ${theme.easings.easeInOutCubic}, box-shadow 0.1s ${theme.easings.easeInOutCubic}`,
      $nest: {
        ...blockColorMixin.$nest,
        '&:hover': {
          cursor: 'pointer',
        },
      },
    },
    selected: {
      boxShadow: `0px 0px 1px 2px ${theme.colors.uiPrimary}`,
    },
    focusing: {
      boxShadow: `0px 0px 1px 2px ${theme.colors.contentText}`,
      $nest: {
        '&:hover': {
          cursor: 'auto',
        },
      },
    },
    moving: {
      opacity: 0.4,
      $nest: {
        '&:hover': {
          cursor: 'grabbing',
        },
      },
    },
    resizer: {
      position: 'absolute',
      top: iconSize + 2,
      right: 0,
      bottom: 0,
      width: 14,
      cursor: 'ew-resize',
    },
    open: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: iconSize,
      height: iconSize,
      padding: 2,
    },
    arrow: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: iconSize,
      height: iconSize,
      padding: 1,
    },
    highlightOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: theme.colors.uiPrimaryVeryLight,
      overflow: 'hidden',
      animation: `${theme.animations.fadeIn} 33ms ${theme.easings.easeInOutCubic}`,
    },
  }),
  ...atoms,
}
