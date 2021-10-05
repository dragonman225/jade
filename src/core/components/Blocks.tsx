import * as React from 'react'
import { useEffect } from 'react'
import { useTransition } from '@react-spring/web'

import { BlockDriver } from './BlockDriver'
import { ViewObject } from './ViewObject'
import { BlockInstance } from '../interfaces'

interface Props {
  blocks: BlockInstance[]
  onRender?: () => void
}

export function Blocks({ blocks, onRender }: Props): JSX.Element {
  const transitions = useTransition(blocks, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    keys: blocks.map(b => `vo-b-${b.id}`),
  })

  /** Run on mount. */
  useEffect(() => {
    onRender && onRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {transitions(({ opacity }, b) => (
        <ViewObject
          key={`vo-b-${b.id}`}
          posType={b.posType}
          pos={b.pos}
          size={b.size}
          animatedOpacity={opacity}>
          <BlockDriver block={b} />
        </ViewObject>
      ))}
    </>
  )
}
