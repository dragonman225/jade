import { cssRaw, stylesheet } from 'typestyle'

import theme from '../theme'

cssRaw(`
*::selection {
  background: hsla(165deg, 100%, 60%, 0.3);
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
    color: theme.colors.contentText,
    background: theme.colors.bgPrimary,
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
})
