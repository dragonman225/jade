/* eslint-disable react/display-name */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useReducer, useMemo, useCallback, useRef } from 'react'
import { cssRaw, stylesheet } from 'typestyle'

import { Viewport } from './Viewport'
import { Overlay } from './component/Overlay'
import { createReducer, loadAppState } from './reducer'
import { factoryRegistry } from '../factories'
import { DatabaseInterface } from './interfaces'
import { PubSub } from './lib/pubsub'

cssRaw(`
* {
  box-sizing: border-box;
  user-select: none;
}

html, body, #react-root {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

:root {
  font-size: 18px;
  font-family: 'Noto Sans', 'Noto Sans CJK TC', \
  -apple-system, BlinkMacSystemFont, \
  'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', \
  'Helvetica Neue', sans-serif;
  line-height: 1.6;
}`)

interface Props {
  db: DatabaseInterface
}

const styles = stylesheet({
  App: {
    overflow: 'hidden',
    height: '100%',
    background: '#e5e5e5',
    '--bg-hover': 'rgba(0, 0, 0, 0.1)',
    '--shadow-light': `\
      rgba(15, 15, 15, 0.1) 0px 0px 3px, 
      rgba(15, 15, 15, 0.1) 0px 0px 9px`,
    '--border-radius-small': '.3rem',
    '--border-radius-large': '.5rem',
  },
})

export function App(props: Props): JSX.Element {
  const { db } = props

  const messageBus = useMemo(() => new PubSub(), [])
  const appStateReducer = useCallback(createReducer(db), [])
  const initialState = useMemo(() => loadAppState(db), [])
  const [state, dispatchAction] = useReducer(appStateReducer, initialState)
  const overlayRef = useRef<HTMLDivElement>(null)

  const createOverlay = useCallback(
    (children: React.ReactNode): React.ReactPortal => {
      return ReactDOM.createPortal(children, overlayRef.current)
    },
    [overlayRef.current]
  )

  return (
    <div className={styles.App}>
      <Overlay ref={overlayRef} />
      <Viewport
        focus={state.camera.focus}
        scale={state.camera.scale}
        blocks={state.blocks}
        dispatchAction={dispatchAction}
        factoryRegistry={factoryRegistry}
        // db={db}
        // createOverlay={createOverlay}
        // messageBus={messageBus}
      />
    </div>
  )
}
