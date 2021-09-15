import { keyframes } from 'typestyle'

export default {
  colors: {
    bgCanvas: 'var(--bg-canvas)',
    bgBlock: 'var(--bg-block)',
    bgHover: 'hsla(165deg, 10%, 25%, 0.08)',
    bgActive: 'hsla(165deg, 10%, 25%, 0.16)',
    bgGrey: '#eeeeee',
    bgDangerHover: 'var(--bg-danger-hover)',
    bgDangerActive: 'var(--bg-danger-active)',
    contentText: 'hsl(165deg, 10%, 25%)',
    uiText: 'var(--ui-text)',
    uiDanger: 'var(--ui-danger)',
    uiPrimaryVeryLight: 'hsla(165deg, 65%, 55%, 0.2)',
    uiPrimaryLight: 'hsla(165deg, 65%, 55%, 0.8)',
    uiPrimary: 'hsl(165deg, 65%, 55%)',
    uiPrimaryHarder: 'hsl(42deg, 20%, 35%)',
    uiPrimaryAttractive: 'hsl(165deg, 80%, 79%)',
    uiPrimaryAttractiveHover: 'hsl(165deg, 80%, 74%)',
    uiPrimaryAttractiveActive: 'hsl(165deg, 80%, 69%)',
    uiSecondaryDumb: 'hsl(42deg, 8%, 75%)',
    uiGrey: '#8e8e8e',
    uiGreyLight: 'var(--ui-grey-light)',
  },
  shadows: {
    ui: `
      rgba(15, 15, 15, 0.15) 0px 0px 2px, 
      rgba(15, 15, 15, 0.1) 0px 0px 7px`,
    ui2: `
      hsla(42deg, 15%, 10%, 0.1) 0px 0px 2px,
      hsla(42deg, 15%, 30%, 0.1) 0px 0px 7px,
      hsla(42deg, 15%, 50%, 0.1) 0px 0px 16px`,
    float: `rgba(17, 12, 46, 0.15) 0px 38px 100px`,
    float2: `
      hsla(42deg, 15%, 70%, 0.05) 0px 16px 36px 8px,
      hsla(42deg, 30%, 20%, 0.1) 0px 32px 72px 8px`,
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
    /** Create compact paddings for view mode "block". */
    blockCompact: '.35rem 1.25rem',
    /** Create comfortable paddings for view mode "navItem". */
    navComfort: '.5rem',
  },
  arrowSize: 6,
}
