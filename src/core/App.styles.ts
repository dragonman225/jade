import { cssRaw, stylesheet } from 'typestyle'

import theme from '../theme'

cssRaw(`
*::selection {
  background: rgba(45, 170, 219, 0.3);
}

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
    color: theme.colors.uiBlack,
    background: theme.colors.bgPrimary,
  },
  'App--BlockMoving': {
    cursor: 'grabbing',
  },
})
