import { stylesheet } from 'typestyle'

import { blockColorMixin } from '../utils/block'
import theme from '../../theme'

const atoms = stylesheet({
  actionButton: {
    opacity: 0,
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
    opacity: 1,
    transition: `0.1s opacity ${theme.easings.easeInOutCubic}`,
  },
})

export const styles = {
  ...stylesheet({
    block: {
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
        [`&:hover > .${atoms.actionButton}`]: {
          opacity: 1,
        },
        [`&:hover > .${atoms.blink}`]: {
          opacity: 0,
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
