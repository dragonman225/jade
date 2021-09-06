import * as React from 'react'
import { IconStyle } from './Icon.styles'

/**
 * SVG is copied from Material Icons "arrow_north_east"
 * (https://fonts.google.com/icons?selected=Material+Icons).
 *
 * The use is governed by the "Apache License, Version 2.0".
 */

export const ArrowNorthEast: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg">
      <rect fill="none" height="24" width="24" />
      <path d="M9,6L9,6c0,0.56,0.45,1,1,1h5.59L4.7,17.89c-0.39,0.39-0.39,1.02,0,1.41h0c0.39,0.39,1.02,0.39,1.41,0L17,8.41V14 c0,0.55,0.45,1,1,1H18c0.55,0,1-0.45,1-1V6c0-0.55-0.45-1-1-1H10C9.45,5,9,5.45,9,6z" />
    </svg>
  )
}
