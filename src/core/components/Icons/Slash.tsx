import * as React from 'react'
import { IconStyle } from './Icon.styles'

export const SlashHint: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <path d="M14 8L10 16" strokeLinecap="round" />
    </svg>
  )
}
