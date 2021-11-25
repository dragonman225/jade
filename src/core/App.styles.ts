import { stylesheet } from 'typestyle'

import theme from '../theme'

export const AppStyles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    color: theme.colors.contentText,
    background: theme.colors.bgCanvas,
    transition: `background 0.3s ${theme.easings.easeInOutCubic}`,
  },
  'App--BlockMoving': {
    cursor: 'grabbing',
  },
  'App--BlockResizing': {
    cursor: 'ew-resize',
  },
  'App--DrawingRelation': {
    cursor: 'crosshair',
  },
})
