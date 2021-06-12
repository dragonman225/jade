import * as React from 'react'
import { CSSProperties } from 'react'

interface Props {
  style: CSSProperties
}

export function SelectionBox(props: Props): JSX.Element {
  const { style } = props

  return (
    <div
      style={{
        ...style,
        border: '2px solid rgba(138, 43, 226, 0.8)',
        background: 'rgba(138, 43, 226, 0.2)',
      }}
    />
  )
}
