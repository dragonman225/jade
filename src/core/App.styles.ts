import { stylesheet } from 'typestyle'

import theme from '../theme'

export const AppStyles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    color: theme.colors.contentText,
    background: theme.colors.bgCanvas,
    transition: `background 0.3s ${theme.easings.easeInOutCubic}`,
    $nest: {
      '& ::-webkit-scrollbar': {
        width: '.5rem',
        height: '.5rem',
        backgroundColor: 'inherit',
      },
      '& ::-webkit-scrollbar-thumb': {
        background: theme.colors.bgHover,
        $nest: {
          '&:active': {
            background: theme.colors.bgActive,
          },
        },
      },
    },
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
