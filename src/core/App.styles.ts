import { stylesheet } from 'typestyle'

import theme from '../theme'

export const appStyles = stylesheet({
  app: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    overflow: 'hidden',
    color: theme.colors.contentText,
    background: theme.colors.bgCanvas,
    transition: `\
color 0.5s ${theme.easings.easeInOutCubic},
background 0.5s ${theme.easings.easeInOutCubic}`,
  },
  movingBlocks: {
    cursor: 'grabbing',
  },
  resizingBlocks: {
    cursor: 'ew-resize',
  },
  drawingRelation: {
    cursor: 'crosshair',
  },
})
