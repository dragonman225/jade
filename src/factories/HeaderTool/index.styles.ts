import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { buttonTransparent, navBasic } from '../../lightComponents'

const titleContainerMaxHeight = 300

export const styles = stylesheet({
  HeaderToolNav: {
    ...navBasic,
  },
  HeaderToolBlock: {
    width: '100%',
    display: 'flex',
    flexWrap: 'nowrap',
    padding: theme.paddings.blockComfort,
    paddingTop: '.35rem',
    paddingBottom: '.35rem',
    minHeight: '2.2rem',
    maxHeight: '2.2rem',
    transition: `max-height 0.2s ${theme.easings.easeInOutCubic}`,
    overflow: 'hidden',
  },
  HeaderToolBlockNotCollapsed: {
    maxHeight: titleContainerMaxHeight,
  },
  Button: {
    ...buttonTransparent,
    flex: '0 0 1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    padding: '.2rem',
    fill: theme.colors.uiBlack,
    $nest: {
      ...buttonTransparent.$nest,
      '&:first-child': {
        marginRight: '.3rem',
      },
    },
  },
  TitleContainer: {
    flex: '1 1 0',
    padding: '.1rem .5rem',
    margin: 'auto 0',
    fontSize: '.95rem',
  },
  TitleContainerNotCollapsed: {
    maxHeight: `calc(${titleContainerMaxHeight}px - 0.7rem)`,
    overflow: 'auto',
  },
})
