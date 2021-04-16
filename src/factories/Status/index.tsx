import * as React from 'react'
import { stylesheet } from 'typestyle'
import {
  ContentProps,
  PubSubStatusMessage,
  UnifiedEventInfo,
} from '../../core/interfaces'
import { InitializedConceptData } from '../../core/interfaces/concept'

const styles = stylesheet({
  StatNavItem: {
    fontSize: '.8rem',
    padding: '.5rem',
    maxHeight: '100%',
    background: 'aquamarine',
  },
  StatBlock: {
    userSelect: 'none',
    padding: '1rem',
    $nest: {
      '& span': {
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
        userSelect: 'none',
      },
    },
  },
  MouseData: {
    $nest: {
      '&>p': {
        margin: 0,
      },
    },
  },
  Highlight: {
    background: 'aquamarine',
  },
})

type Props = ContentProps<InitializedConceptData>

export const Status: React.FunctionComponent<Props> = props => {
  const [statusText, setStatusText] = React.useState<string>('')
  const [highlightText, setHighlightText] = React.useState<string>('')
  const [mouse, setMouse] = React.useState<UnifiedEventInfo>({
    clientX: 0,
    clientY: 0,
    originX: 0,
    originY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  const handleMousemove = (msg: UnifiedEventInfo) => {
    setMouse(msg)
  }

  const handleStatMsg = (msg: PubSubStatusMessage) => {
    const channels = msg.channels
    const newStatusText = Object.values(channels).reduce((result, cv) => {
      return (result += `${cv.name}: ${cv.subNum}\n`)
    }, '')
    setStatusText(newStatusText)
    setHighlightText(msg.activeChannel)
  }

  React.useEffect(() => {
    const messageBus = props.messageBus
    messageBus.subscribe<UnifiedEventInfo>('user::mousemove', handleMousemove)
    messageBus.subscribe<PubSubStatusMessage>('pubsub::status', handleStatMsg)
    return () => {
      messageBus.unsubscribe('user::mousemove', handleMousemove)
      messageBus.unsubscribe('pubsub::status', handleStatMsg)
    }
  }, [])

  switch (props.viewMode) {
    case 'Block':
      return (
        <div className={styles.StatBlock}>
          <section className={styles.MouseData}>
            <h3>Mouse</h3>
            <p>
              Client: ({mouse.clientX.toFixed(0)}, {mouse.clientY.toFixed(0)})
            </p>
            <p>
              Origin: ({mouse.originX.toFixed(0)}, {mouse.originY.toFixed(0)})
            </p>
            <p>
              Offset: ({mouse.offsetX.toFixed(0)}, {mouse.offsetY.toFixed(0)})
            </p>
          </section>
          <section>
            <h3>Event</h3>
            <p>
              <strong>Last</strong>: {highlightText}
            </p>
            {(function () {
              const highlightStart = statusText.indexOf(highlightText)
              const highlightEnd = highlightStart + highlightText.length
              if (highlightStart === -1) {
                return <span>{statusText}</span>
              } else {
                return (
                  <>
                    <span>{statusText.substring(0, highlightStart)}</span>
                    <span className={styles.Highlight}>
                      {statusText.substring(highlightStart, highlightEnd)}
                    </span>
                    <span>{statusText.substring(highlightEnd)}</span>
                  </>
                )
              }
            })()}
          </section>
        </div>
      )
    default:
      return <div className={styles.StatNavItem}>Status Viewer</div>
  }
}
