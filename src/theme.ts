import { keyframes } from 'typestyle'

export default {
  colors: {
    bgCanvas: 'var(--bg-canvas)',
    bgCanvasSemiTransparent: 'var(--bg-canvas-semi-transparent)',
    bgBlock: 'var(--bg-block)',
    bgHover: 'var(--bg-hover)',
    bgActive: 'var(--bg-active)',
    bgDangerHover: 'var(--bg-danger-hover)',
    bgDangerActive: 'var(--bg-danger-active)',
    contentText: 'var(--content-text)',
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
    neutral95: 'var(--neutral-95)',
    neutral90: 'var(--neutral-90)',
    neutral70: 'var(--neutral-70)',
    neutral60: 'var(--neutral-60)',
    neutral50: 'var(--neutral-50)',
    neutral40: 'var(--neutral-40)',
    neutral10: 'var(--neutral-10)',
  },
  shadows: {
    focus: 'var(--shadow-focus)',
    layer: 'var(--shadow-layer)',
    float: 'var(--shadow-float)',
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
  fonts: {
    monospace: 'var(--font-monospace)',
  },
}
