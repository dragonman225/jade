import * as React from 'react'
import { IconStyle } from './Icon.styles'

/**
 * SVG is modified from Material Icons "camera_outdoor"
 * (https://fonts.google.com/icons?selected=Material+Icons).
 *
 * The use is governed by the "Apache License, Version 2.0".
 */

export const Home = React.memo(function Home() {
  return (
    <svg
      className={IconStyle}
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M12,3 L4,9v12h16v-2H6v-9l6-4.5l6,4.5v9h2V9L12,3z" />
      </g>
    </svg>
  )
})
