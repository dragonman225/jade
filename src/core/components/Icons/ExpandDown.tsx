import * as React from 'react'
import { IconStyle } from './Icon.styles'

/**
 * SVG is copied from Material Icons "expand_more"
 * (https://fonts.google.com/icons?selected=Material+Icons).
 *
 * The use is governed by the "Apache License, Version 2.0".
 */

export const ExpandDown: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  )
}