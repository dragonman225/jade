import * as React from 'react'
import { IconStyle } from './Icon.styles'

/**
 * SVG is copied from Material Icons "expand_less"
 * (https://fonts.google.com/icons?selected=Material+Icons).
 *
 * The use is governed by the "Apache License, Version 2.0".
 */

export const ExpandUp: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
    </svg>
  )
}
