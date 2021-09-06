import { keyframes } from 'typestyle'

export default {
  colors: {
    bgPrimary: 'hsl(42deg, 70%, 96%)',
    bgSecondary: 'hsl(42deg, 70%, 98.5%)',
    bgHover: 'hsla(165deg, 10%, 25%, 0.08)',
    bgActive: 'hsla(165deg, 10%, 25%, 0.16)',
    bgGrey: '#eeeeee',
    contentText: 'hsl(165deg, 10%, 25%)',
    uiText: 'hsl(165deg, 80%, 21%)',
    uiPrimaryVeryLight: 'hsla(165deg, 65%, 55%, 0.2)',
    uiPrimaryLight: 'hsla(165deg, 65%, 55%, 0.8)',
    uiPrimary: 'hsl(165deg, 65%, 55%)',
    uiPrimaryHarder: 'hsl(42deg, 20%, 35%)',
    uiPrimaryAttractive: 'hsl(165deg, 80%, 79%)',
    uiPrimaryAttractiveHover: 'hsl(165deg, 80%, 74%)',
    uiPrimaryAttractiveActive: 'hsl(165deg, 80%, 69%)',
    uiGrey: '#8e8e8e',
    uiGreyLight: '#e4e4e4',
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
  paddings: {
    /** Create comfortable paddings for view mode "block". */
    blockComfort: '.5rem 1.25rem',
    /** Create comfortable paddings for view mode "navItem". */
    navComfort: '.5rem',
  },
  arrowSize: 6,
}
