import * as React from 'react'
import { PubSub } from '../lib/pubsub'
import { UnifiedEventInfo } from '../interfaces'

export interface StatusProps {
  text: string
  highlight: string
  messenger: PubSub
}

export function Status(props: StatusProps): JSX.Element {
  const highlightStart = props.text.indexOf(props.highlight)
  const highlightEnd = highlightStart + props.highlight.length
  const [mouse, setMouse] = React.useState<UnifiedEventInfo>({
    clientX: 0, clientY: 0, offsetX: 0, offsetY: 0
  })

  const handleMousemove = (e: UnifiedEventInfo) => {
    setMouse(e)
  }

  React.useEffect(() => {
    props.messenger.subscribe('user::mousemove', handleMousemove)
    return () => {
      props.messenger.unsubscribe('user::mousemove', handleMousemove)
    }
  }, [])

  return (
    <div>
      <style jsx>{`
        div {
          user-select: none;
          padding: 1rem;
        }

        span {
          white-space: pre-wrap;
          line-height: 1.5;
          user-select: none;
        }

        .highlight {
          background: aquamarine;
        }
      `}</style>
      <h3>Mouse Position:&nbsp;({mouse.offsetX.toFixed(0)}, {mouse.offsetY.toFixed(0)})</h3>
      {
        props.highlight
          ? <h3>{props.highlight}</h3>
          : <h3>undefined</h3>
      }
      {
        highlightStart === -1
          ? <span>{props.text}</span>
          :
          <>
            <span>{props.text.substring(0, highlightStart)}</span>
            <span className="highlight">
              {props.text.substring(highlightStart, highlightEnd)}
            </span>
            <span>{props.text.substring(highlightEnd)}</span>
          </>
      }
    </div>
  )
}