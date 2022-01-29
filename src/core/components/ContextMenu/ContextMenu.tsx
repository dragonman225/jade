import * as React from 'react'
import { useEffect, useRef } from 'react'

import { styles } from './ContextMenu.styles'
import { ContextMenuForBlock } from './ContextMenuForBlock'
import { ContextMenuForRelation } from './ContextMenuForRelation'
import { ContextMenuType } from './types'
import { useAppState } from '../../store/appStateContext'
import { useSystem } from '../../store/systemContext'
import { Action } from '../../store/actions'

export function ContextMenu(): JSX.Element {
  const appState = useAppState()
  const { dispatchAction } = useSystem()
  const rContextMenuEl = useRef<HTMLDivElement>(null)
  const context = appState.contextMenuState.context

  /** Close ContextMenu when clicking outside or when window resize. */
  useEffect(() => {
    function closeContextMenu() {
      dispatchAction({ type: Action.ContextMenuClose })
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (e instanceof MouseEvent && e.button === 2) return
      if (!rContextMenuEl.current?.contains(e.target as Node)) {
        closeContextMenu()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('resize', closeContextMenu)
    window.addEventListener('wheel', closeContextMenu)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('resize', closeContextMenu)
      window.removeEventListener('wheel', closeContextMenu)
    }
  }, [dispatchAction])

  if (!context) {
    return (
      <div className={styles.ContextMenu}>
        <div className={styles.Title}>
          Something is wrong. Cannot find entities to operate on.
        </div>
      </div>
    )
  }

  switch (context.type) {
    case ContextMenuType.Block: {
      return <ContextMenuForBlock ref={rContextMenuEl} context={context} />
    }
    case ContextMenuType.Relation: {
      return <ContextMenuForRelation ref={rContextMenuEl} context={context} />
    }
  }
}
