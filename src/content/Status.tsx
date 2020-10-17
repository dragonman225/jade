import * as React from 'react'
import { PubSub } from '../lib/pubsub'
import { PubSubStatusMessage, UnifiedEventInfo } from '../interfaces'

export interface StatusProps {
  messenger: PubSub
}

export function Status(props: StatusProps): JSX.Element {
  const [statusText, setStatusText] = React.useState<string>('')
  const [highlightText, setHighlightText] = React.useState<string>('')
  const [mouse, setMouse] = React.useState<UnifiedEventInfo>({
    clientX: 0, clientY: 0, offsetX: 0, offsetY: 0
  })

  const handleMousemove = (msg: UnifiedEventInfo) => {
    setMouse(msg)
  }

  const handlePubSubStatusMessage = (msg: PubSubStatusMessage) => {
    const channels = msg.channels
    const newStatusText = Object.values(channels).reduce((result, cv) => {
      return result += `${cv.name}: ${cv.subNum}\n`
    }, '')
    setStatusText(newStatusText)
    setHighlightText(msg.activeChannel)
  }

  React.useEffect(() => {
    const messenger = props.messenger
    messenger.subscribe<UnifiedEventInfo>('user::mousemove', handleMousemove)
    messenger.subscribe<PubSubStatusMessage>('pubsub::status', handlePubSubStatusMessage)
    return () => {
      messenger.unsubscribe('user::mousemove', handleMousemove)
      messenger.unsubscribe('pubsub::status', handlePubSubStatusMessage)
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
        highlightText
          ? <h3>{highlightText}</h3>
          : <h3>undefined</h3>
      }
      {
        function () {
          const highlightStart = statusText.indexOf(highlightText)
          const highlightEnd = highlightStart + highlightText.length
          if (highlightStart === -1) {
            return <span>{statusText}</span>
          } else {
            return (
              <>
                <span>{statusText.substring(0, highlightStart)}</span>
                <span className="highlight">
                  {statusText.substring(highlightStart, highlightEnd)}
                </span>
                <span>{statusText.substring(highlightEnd)}</span>
              </>
            )
          }
        }()
      }
    </div>
  )
}