import { stylesheet } from 'typestyle'

import theme from '../../theme'
import { buttonPrimary, input } from '../../lightComponents'

export const styles = stylesheet({
  EmbedBlock: {
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
  Input: {
    ...input,
    width: '100%',
  },
  Button: {
    ...buttonPrimary,
  },
  FrameWrapper: {
    position: 'relative',
    paddingBottom: '56.25%' /* 16:9 -> 9/16*100% */,
    paddingTop: 25 /* This creates black bars at the top and the bottom of the video. */,
    height: 0,
    $nest: {
      '& > iframe': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      },
    },
  },
})
