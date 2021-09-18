import * as React from 'react'
import { useCallback, useMemo, useContext } from 'react'
import { classes } from 'typestyle'

import { styles } from './ContextMenu.styles'
import { InfoLine } from './InfoLine'
import { ContextForBlock, ListOption } from './types'
import { BlockColor } from '../../interfaces'
import { Action } from '../../store/actions'
import { SystemContext } from '../../store/systemContext'
import { getDateString } from '../../utils'
import { getFocusForBlock } from '../../utils/block'

interface Props {
  context: ContextForBlock
}

export const ContextMenuForBlock = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenuForBlock({ context }, ref) {
    const { block, concept } = context
    const { dispatchAction } = useContext(SystemContext)

    const setColor = useCallback(
      (color: BlockColor | undefined) => {
        dispatchAction({
          type: Action.BlockSetColor,
          data: {
            id: block.id,
            color,
          },
        })
      },
      [block.id, dispatchAction]
    )

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

    const focusBlock = useCallback(() => {
      const targetScale = 1
      const newFocus = getFocusForBlock(block.id, targetScale)
      if (newFocus) {
        dispatchAction({
          type: Action.CameraSetValue,
          data: {
            focus: newFocus,
            scale: targetScale,
          },
        })
      }
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [block.id, dispatchAction])

    const copyLink = useCallback(() => {
      console.log(block, concept)
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [block, concept, dispatchAction])

    const actions = useMemo<ListOption[]>(
      () => [
        {
          title: 'Delete block',
          perform: deleteBlock,
        },
        {
          title: 'Focus block',
          perform: focusBlock,
        },
        {
          title: 'Copy link',
          perform: copyLink,
        },
      ],
      [focusBlock, copyLink, deleteBlock]
    )

    return (
      <div ref={ref} className={styles.ContextMenu}>
        <div>
          <div className={styles.Title}>BACKGROUND</div>
          <div className={styles.TileButtonGroup}>
            <button
              key={'default'}
              className={styles.TileButton}
              onClick={() => setColor(undefined)}>
              <div className={styles.ColorTile} data-color={'default'} />
            </button>
            {Object.values(BlockColor).map(color => (
              <button
                key={color}
                className={styles.TileButton}
                onClick={() => setColor(color)}>
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
)
