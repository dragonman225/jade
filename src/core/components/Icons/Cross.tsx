import * as React from 'react'
import { IconStyle } from './Icon.styles'

export const Cross: React.FunctionComponent = React.memo(function Cross() {
  return (
    <svg
      className={IconStyle}
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="1.74756"
        width="19.7712"
        height="2.4714"
        transform="rotate(45 1.74756 0)"
      />
      <rect
        y="13.9804"
        width="19.7712"
        height="2.4714"
        transform="rotate(-45 0 13.9804)"
      />
    </svg>
  )
})
