import { keyframes } from 'typestyle'

export default {
  colors: {
    bgPrimary: '#f3f3f3',
    bgWhite: '#ffffff',
    bgGrey: '#eeeeee',
    bgHover: 'rgba(55, 53, 47, 0.08)',
    bgActive: 'rgba(55, 53, 47, 0.16)',
    uiPrimary: 'rgb(115, 0, 216)',
    uiPrimaryLight: 'rgba(115, 0, 216, 0.8)',
    uiPrimaryVeryLight: 'rgba(115, 0, 216, 0.2)',
    uiGrey: '#8e8e8e',
    uiGreyLight: '#e4e4e4',
    uiBlack: 'rgb(55, 53, 47)',
  },
  shadows: {
    ui: `
      rgba(15, 15, 15, 0.15) 0px 0px 2px, 
      rgba(15, 15, 15, 0.1) 0px 0px 7px`,
    float: `rgba(17, 12, 46, 0.15) 0px 38px 100px 0px`,
  },
  borders: {
    largeRadius: '.6rem',
    smallRadius: '.3rem',
  },
  animations: {
    fadeIn: keyframes({
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    }),
  },
  easings: {
    /** @see https://easings.net/#easeInOutCubic */
    easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
}
