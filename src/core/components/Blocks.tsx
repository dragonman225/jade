import * as React from 'react'
import { useEffect } from 'react'

import { BlockDriver } from './BlockDriver'
import { ViewObject } from './ViewObject'
import { BlockInstance } from '../interfaces'

interface Props {
  blocks: BlockInstance[]
  onRender?: () => void
}

export function Blocks({ blocks, onRender }: Props): JSX.Element {
  /** Run on mount. */
  useEffect(() => {
    onRender && onRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {blocks.map(b => (
        <ViewObject
          key={`vo-b-${b.id}`}
          posType={b.posType}
          pos={b.pos}
          size={b.size}>
          <BlockDriver block={b} />
        </ViewObject>
      ))}
    </>
  )
}
