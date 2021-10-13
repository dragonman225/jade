import { stylesheet } from 'typestyle'

import { emptyNavItem } from '../commonStyles'
import theme from '../../theme'
import { buttonPrimary, buttonTranslucent, input } from '../../lightComponents'

export const styles = stylesheet({
  ImageNavItem: {
    height: '100%',
    maxHeight: 'inherit',
    overflow: 'hidden',
    $nest: {
      '&>img': {
        width: '100%',
        height: '100%',
        maxHeight: 'inherit',
        objectFit: 'contain',
      },
    },
  },
  ImageErrorMsg: {
    ...emptyNavItem,
  },
  ImageBlockViewer: {
    display: 'flex' /* Remove extra space below img. */,
    height: '100%',
    overflow: 'hidden',
    $nest: {
      '&>img': {
        width: '100%',
      },
      "&>img[data-view-mode='CardTitle']": {
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'left center',
      },
      '& > button': {
        ...buttonTranslucent,
        position: 'absolute',
        top: 12,
        right: 20,
        opacity: 0,
        transition: `background 0.1s ease-in-out, opacity 0.15s ${theme.easings.easeInOutCubic}`,
      },
      '&:hover > button': {
        opacity: 1,
      },
    },
  },
  ImageBlockChooser: {
    padding: theme.paddings.blockComfort,
    paddingBottom: '.7rem',
    $nest: {
      '&>input': {
        width: '100%',
      },
    },
  },
  Title: {
    fontWeight: 600,
    marginBottom: '.3rem',
  },
  ImgLinkInput: {
    ...input,
    marginBottom: '.5rem',
  },
  ImgLinkButton: {
    ...buttonPrimary,
    marginBottom: '.7rem',
  },
  ChooseImgBtn: {
    ...buttonPrimary,
    $nest: {
      ...buttonPrimary.$nest,
      '& > input': { display: 'none' },
    },
  },
})
