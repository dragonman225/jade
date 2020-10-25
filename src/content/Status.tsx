import * as React from 'react'
import {
  ContentProps, PubSubStatusMessage, UnifiedEventInfo
} from '../interfaces'

export const Status: React.FunctionComponent<ContentProps<unknown>> = (props) => {
  const [statusText, setStatusText] = React.useState<string>('')
  const [highlightText, setHighlightText] = React.useState<string>('')
  const [mouse, setMouse] = React.useState<UnifiedEventInfo>({
    clientX: 0, clientY: 0, originX: 0, originY: 0, offsetX: 0, offsetY: 0
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
    const messageBus = props.messageBus
    messageBus.subscribe<UnifiedEventInfo>('user::mousemove', handleMousemove)
    messageBus.subscribe<PubSubStatusMessage>('pubsub::status', handlePubSubStatusMessage)
    return () => {
      messageBus.unsubscribe('user::mousemove', handleMousemove)
      messageBus.unsubscribe('pubsub::status', handlePubSubStatusMessage)
    }
  }, [])

  switch (props.viewMode) {
    case 'block':
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
    default:
      return <span>Status</span>
  }
}