import * as React from 'react'
import { useEffect } from 'react'
import { useTransition, animated } from '@react-spring/web'

import { BlockDriver } from './BlockDriver'
import { ViewObject } from './ViewObject'
import { BlockInstance } from '../interfaces'
import { stylesheet } from 'typestyle'

interface Props {
  blocks: BlockInstance[]
  onRender?: () => void
}

const styles = stylesheet({
  ul: {
    listStyle: 'none',
    margin: 0,
  },
})

export function BlockList({ blocks, onRender }: Props): JSX.Element {
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
    <ul className={styles.ul}>
      {transitions(({ opacity }, b) => (
        <animated.li style={{ opacity }}>
          <ViewObject
            key={`vo-b-${b.id}`}
            posType={b.posType}
            pos={b.pos}
            size={b.size}
            zIndex={b.zIndex}>
            <BlockDriver block={b} />
          </ViewObject>
        </animated.li>
      ))}
    </ul>
  )
}
