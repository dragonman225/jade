import { stylesheet } from 'typestyle'

import { blockColorMixin } from '../utils/block'
import theme from '../../theme'

const iconSize = 18

const atoms = stylesheet({
  actionButton: {
    transition: `0.1s opacity ${theme.easings.easeInOutCubic}, 30ms fill ${theme.easings.easeInOutCubic}`,
    fill: theme.colors.neutral60,
    cursor: 'pointer',
    borderRadius: theme.borders.smallRadius,
    $nest: {
      '&:hover': {
        fill: theme.colors.neutral40,
        background: theme.colors.bgHover,
      },
      '&:active': {
        fill: theme.colors.neutral10,
        background: theme.colors.bgActive,
      },
    },
  },
  blink: {
    position: 'absolute',
    top: 0,
    left: 0,
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
      transition: `\
opacity 0.2s ${theme.easings.easeInOutCubic},
box-shadow 0.2s ${theme.easings.easeInOutCubic},
background 0.5s ${theme.easings.easeInOutCubic}`,
      animation: `${theme.animations.fadeIn} 0.3s ${theme.easings.easeInOutCubic}`,
      $nest: {
        ...blockColorMixin.$nest,
        '&:hover': {
          cursor: 'pointer',
        },
      },
    },
    fillParentHeight: {
      height: '100%',
    },
    selected: {
      boxShadow: `0px 0px 1px 2px ${theme.colors.uiPrimary}`,
    },
    focusing: {
      boxShadow: theme.shadows.focus,
      $nest: {
        '&:hover': {
          cursor: 'auto',
        },
      },
    },
    moving: {
      $nest: {
        '&:hover': {
          cursor: 'grabbing',
        },
      },
    },
    widthResizer: {
      position: 'absolute',
      top: iconSize + 2,
      bottom: 0,
      right: 0,
      width: 14,
      cursor: 'ew-resize',
    },
    heightResizer: {
      position: 'absolute',
      left: iconSize + 2,
      right: iconSize + 2,
      bottom: 0,
      height: 14,
      cursor: 'ns-resize',
    },
    widthHeightResizer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: iconSize,
      height: iconSize,
      cursor: 'nwse-resize',
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
