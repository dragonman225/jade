import * as React from 'react'
import {
  ContentProps, InitializedConceptData, PubSubStatusMessage, UnifiedEventInfo
} from '../interfaces'

export const Status: React.FunctionComponent<ContentProps<InitializedConceptData>> = (props) => {
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
    case 'Block':
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

            .MouseData > p {
              margin: 0;
            }

            .EventData .highlight {
              background: aquamarine;
            }
          `}</style>
          <section className="MouseData">
            <h3>Mouse</h3>
            <p>Client: ({mouse.clientX.toFixed(0)}, {mouse.clientY.toFixed(0)})</p>
            <p>Origin: ({mouse.originX.toFixed(0)}, {mouse.originY.toFixed(0)})</p>
            <p>Offset: ({mouse.offsetX.toFixed(0)}, {mouse.offsetY.toFixed(0)})</p>
          </section>
          <section className="EventData">
            <h3>Event</h3>
            <p><strong>Last</strong>: {highlightText}</p>
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
          </section>
        </div>
      )
    default:
      return <span>Status</span>
  }
}