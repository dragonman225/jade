import { cssRaw, stylesheet } from 'typestyle'

import theme from '../theme'

cssRaw(`
* {
  box-sizing: border-box;
  user-select: none;
}

html, body, #react-root {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

:root {
  font-size: 18px;
  font-family:
    'Noto Sans', 'Noto Sans CJK TC',
    -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  line-height: 1.6;
}`)

export const AppStyles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    background: theme.COLORS.bgPrimary,
    '--bg-hover': 'rgba(0, 0, 0, 0.1)',
  },
  'App--BlockMoving': {
    cursor: 'grabbing',
  },
})
