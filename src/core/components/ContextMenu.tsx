import * as React from 'react'
import { useEffect, useContext, useRef, useMemo, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './ContextMenu.styles'
import { InfoLine } from './InfoLine'
import { AppStateContext } from '../store/appStateContext'
import { System, SystemContext } from '../store/systemContext'
import { Action } from '../store/actions'
import {
  AppState,
  BlockColor,
  BlockInstance,
  TypedConcept,
} from '../interfaces'
import { getDateString, vecSub, viewportCoordsToEnvCoords } from '../utils'
import { getFocusForBlockCentered, getOverBlock } from '../utils/block'

type ListOption = {
  title: string
  perform: () => void
  danger?: boolean
}

enum ContextMenuType {
  SingleBlock = 'singleBlock',
}

type Context = {
  type: ContextMenuType.SingleBlock
  block: BlockInstance
  concept: TypedConcept<unknown>
}

function getContext(appState: AppState, system: System): Context | undefined {
  const { contextMenuPos, camera, blocks } = appState
  const pointerInEnvCoords = viewportCoordsToEnvCoords(contextMenuPos, camera)
  const overBlock = getOverBlock(pointerInEnvCoords, blocks)
  return (
    overBlock && {
      type: ContextMenuType.SingleBlock,
      block: overBlock,
      concept: system.db.getConcept(overBlock.conceptId),
    }
  )
}

export function ContextMenu(): JSX.Element {
  const appState = useContext(AppStateContext)
  const system = useContext(SystemContext)
  const { camera } = appState
  const { dispatchAction } = system
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const context = getContext(appState, system)
  const { block, concept } = context

  const focusBlock = useCallback(() => {
    dispatchAction({
      type: Action.CameraMoveDelta,
      data: vecSub(
        camera.focus,
        getFocusForBlockCentered(block.id, camera.scale)
      ),
    })
    dispatchAction({
      type: Action.ContextMenuClose,
    })
  }, [block.id, camera, dispatchAction])

  const copyLink = useCallback(() => {
    console.log(block, concept)
    dispatchAction({
      type: Action.ContextMenuClose,
    })
  }, [block, concept, dispatchAction])

  const deleteBlock = useCallback(() => {
    dispatchAction({
      type: Action.BlockRemove,
      data: {
        id: block.id,
      },
    })
    dispatchAction({
      type: Action.ContextMenuClose,
    })
  }, [block.id, dispatchAction])

  const actions = useMemo<ListOption[]>(
    () => [
      {
        title: 'Focus block',
        perform: focusBlock,
      },
      {
        title: 'Copy link',
        perform: copyLink,
      },
      {
        title: 'Delete block',
        perform: deleteBlock,
      },
    ],
    [focusBlock, copyLink, deleteBlock]
  )

  /** Close ContextMenu when clicking outside. */
  useEffect(() => {
    function closeContextMenu() {
      dispatchAction({ type: Action.ContextMenuClose })
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('resize', closeContextMenu)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('resize', closeContextMenu)
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

  return (
    <div ref={contextMenuRef} className={styles.ContextMenu}>
      <div>
        <div className={styles.Title}>BACKGROUND</div>
        <div className={styles.TileButtonGroup}>
          <button key={'default'} className={styles.TileButton}>
            <div className={styles.ColorTile} data-color={'default'} />
          </button>
          {Object.values(BlockColor).map(color => (
            <button key={color} className={styles.TileButton}>
              <div className={styles.ColorTile} data-color={color} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className={styles.Title}>ACTION</div>
        {actions.map(action => (
          <button
            key={action.title}
            className={classes(
              styles.ListButton,
              action.danger && styles.Danger
            )}
            onClick={action.perform}>
            {action.title}
          </button>
        ))}
      </div>
      <div>
        <div className={styles.Title}>INFO</div>
        <div className={styles.InfoLines}>
          <InfoLine
            label="Created"
            value={getDateString(concept.createdTime)}
          />
          <InfoLine
            label="Updated"
            value={getDateString(concept.lastEditedTime)}
          />
        </div>
      </div>
    </div>
  )
}
