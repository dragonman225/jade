import * as React from 'react'

interface Props {
  children?: React.ReactNode
}

export function PinnedLayer(props: Props): JSX.Element {
  return <div>{props.children}</div>
}
