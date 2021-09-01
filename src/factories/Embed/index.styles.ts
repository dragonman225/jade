import { stylesheet } from 'typestyle'

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
    $nest: {
      ...buttonTranslucent.$nest,
      '&:not(:last-child)': {
        marginRight: '.3rem',
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
})

export const styles = {
  ...atoms,
  ...molecules,
  ...organisms,
}
