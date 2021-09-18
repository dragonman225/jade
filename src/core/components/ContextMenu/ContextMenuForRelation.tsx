import * as React from 'react'
import { useCallback, useMemo, useContext } from 'react'
import { classes } from 'typestyle'

import { styles } from './ContextMenu.styles'
import { InfoLine } from './InfoLine'
import { ContextForRelation, ListOption } from './types'
import { Action } from '../../store/actions'
import { SystemContext } from '../../store/systemContext'
import { boundingBoxOfBoxes, getFocusForBox, growBox } from '../../utils'
import { blockToBox } from '../../utils/block'

interface Props {
  context: ContextForRelation
}

export const ContextMenuForRelation = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenuForRelation({ context }, ref) {
    const { relation, fromBlock, toBlock } = context
    const { dispatchAction } = useContext(SystemContext)

    const deleteArrow = useCallback(() => {
      dispatchAction({
        type: Action.RelationRemove,
        data: {
          id: relation.id,
        },
      })
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [relation.id, dispatchAction])

    const focusArrow = useCallback(() => {
      const targetScale = 1
      const fromBox = blockToBox(fromBlock)
      const toBox = blockToBox(toBlock)
      const viewBox = growBox(boundingBoxOfBoxes([fromBox, toBox]), 10)
      const newFocus = getFocusForBox(viewBox, targetScale)
      dispatchAction({
        type: Action.CameraSetValue,
        data: {
          focus: newFocus,
          scale: targetScale,
        },
      })
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [fromBlock, toBlock, dispatchAction])

    const copyLink = useCallback(() => {
      console.log(relation)
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [relation, dispatchAction])

    /** May support in the future. */
    // const setColor = useCallback(
    //   (color: BlockColor | undefined) => {
    //     dispatchAction({
    //       type: Action.RelationSetColor,
    //       data: {
    //         id: relation.id,
    //         color,
    //       },
    //     })
    //   },
    //   [relation.id, dispatchAction]
    // )

    const actions = useMemo<ListOption[]>(
      () => [
        {
          title: 'Delete arrow',
          perform: deleteArrow,
        },
        {
          title: 'Focus arrow',
          perform: focusArrow,
        },
        {
          title: 'Copy link',
          perform: copyLink,
        },
      ],
      [deleteArrow, focusArrow, copyLink]
    )

    return (
      <div ref={ref} className={styles.ContextMenu}>
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
            <InfoLine label="id" value={relation.id} />
            <InfoLine label="type" value={relation.type} />
          </div>
        </div>
      </div>
    )
  }
)
