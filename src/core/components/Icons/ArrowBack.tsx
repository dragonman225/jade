import * as React from 'react'
import { IconStyle } from './Icon.styles'

/**
 * SVG is copied from Material Icons "arrow_back"
 * (https://fonts.google.com/icons?selected=Material+Icons).
 *
 * The use is governed by the "Apache License, Version 2.0".
 */

export const ArrowBack: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  )
}
