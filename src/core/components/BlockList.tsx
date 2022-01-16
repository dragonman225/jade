import * as React from 'react'
import { useEffect } from 'react'
// import { useTransition, animated } from '@react-spring/web'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { BlockDriver } from './BlockDriver'
import { ViewObject } from './ViewObject'
import { BlockInstance } from '../interfaces'
import { stylesheet } from 'typestyle'
import theme from '../../theme'

interface Props {
  blocks: BlockInstance[]
  onRender?: () => void
}

const styles = stylesheet({
  ul: {
    listStyle: 'none',
    margin: 0,
  },
  li: {
    $nest: {
      '&-appear': {
        animation: `${theme.animations.fadeIn} 1.4s ${theme.easings.easeOutExpo}`,
      },
      '&-enter': {
        opacity: 0,
      },
      '&-enter-active': {
        opacity: 1,
        transition: `opacity 0.6s ${theme.easings.easeOutExpo}`,
      },
      '&-exit': {
        opacity: 1,
      },
      '&-exit-active': {
        opacity: 0,
        transition: `opacity 0.3s ${theme.easings.easeOutExpo}`,
      },
    },
  },
})

export function BlockList({ blocks, onRender }: Props): JSX.Element {
  // const transitions = useTransition(blocks, {
  //   from: { opacity: 0 },
  //   enter: { opacity: 1 },
  //   leave: { opacity: 0 },
  //   keys: blocks.map(b => `vo-b-${b.id}`),
  // })

  /** Run on mount. */
  useEffect(() => {
    onRender && onRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ul className={styles.ul}>
      {/* {transitions(({ opacity }, b) => (
        <animated.li style={{ opacity }}> */}
      <TransitionGroup component={null} appear={true} enter={true} exit={true}>
        {blocks.map(b => (
          <CSSTransition
            key={`vo-b-${b.id}`}
            timeout={600}
            classNames={styles.li}>
            <li>
              <ViewObject
                posType={b.posType}
                pos={b.pos}
                size={b.size}
                zIndex={b.zIndex}>
                <BlockDriver block={b} />
              </ViewObject>
            </li>
          </CSSTransition>
        ))}
      </TransitionGroup>
      {/* </animated.li>
      ))} */}
    </ul>
  )
}
