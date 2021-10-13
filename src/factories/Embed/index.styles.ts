import { stylesheet } from 'typestyle'

import { emptyNavItem } from '../commonStyles'
import theme from '../../theme'
import { buttonPrimary, buttonTranslucent, input } from '../../lightComponents'

const atoms = stylesheet({
  LinkInput: {
    ...input,
    width: '100%',
  },
  LinkConfirmButton: {
    ...buttonPrimary,
  },
  ControlButton: {
    ...buttonTranslucent,
    borderRadius: 0,
    $nest: {
      ...buttonTranslucent.$nest,
      '&:not(:last-child)': {
        borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
      },
      '&:first-child': {
        borderTopLeftRadius: theme.borders.smallRadius,
        borderBottomLeftRadius: theme.borders.smallRadius,
      },
      '&:last-child': {
        borderTopRightRadius: theme.borders.smallRadius,
        borderBottomRightRadius: theme.borders.smallRadius,
      },
    },
  },
  FrameWrapper: {
    position: 'relative',
    paddingBottom: '56.25%' /* 16:9 -> 9/16*100% */,
    paddingTop: 25 /* This creates black bars at the top and the bottom of the video. */,
    height: 0,
  },
  Frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  NoInteraction: {
    pointerEvents: 'none',
  },
})

const molecules = stylesheet({
  ControlButtonGroup: {
    position: 'absolute',
    top: 12,
    right: 20,
    opacity: 0,
    transition: `opacity 0.15s ${theme.easings.easeInOutCubic}`,
    boxShadow: theme.shadows.backlitTiny,
    borderRadius: theme.borders.smallRadius,
  },
})

const organisms = stylesheet({
  EmbedBlockDisplay: {
    position: 'relative',
    $nest: {
      [`&:hover > .${molecules.ControlButtonGroup}`]: {
        opacity: 1,
      },
    },
  },
  EmbedBlockEmpty: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.paddings.blockComfort,
    $nest: {
      '& > *': {
        display: 'block',
      },
      '& > input': {
        marginBottom: '.7rem',
      },
      '& > button': {
        width: 200,
      },
    },
  },
  emptyNavItem: {
    ...emptyNavItem,
  },
})

export const styles = {
  ...atoms,
  ...molecules,
  ...organisms,
}
