import * as React from 'react'
import { IconStyle } from './Icon.styles'

export const DragHandle: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" />
      <circle cx="10" cy="50" r="10" />
      <circle cx="50" cy="50" r="10" />
      <circle cx="50" cy="10" r="10" />
    </svg>
  )
}
