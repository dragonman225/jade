import * as React from 'react'
import { useCallback, useMemo, useContext } from 'react'
import { classes } from 'typestyle'

import { styles } from './ContextMenu.styles'
import { InfoLine } from './InfoLine'
import { Section } from './Section'
import { ContextForBlock, ListOption } from './types'
import { BlockColor } from '../../interfaces'
import { Action } from '../../store/actions'
import { SystemContext } from '../../store/systemContext'
import { getDateString } from '../../utils'
import { getFocusForBlock } from '../../utils/block'
import { saveTextToClipboard } from '../../utils/clipboard'
import { getUrlForBlock } from '../../utils/url'

interface Props {
  context: ContextForBlock
}

export const ContextMenuForBlock = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenuForBlock({ context }, ref) {
    const { block, parentConcept, linkedConcept } = context
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
      const newFocus = getFocusForBlock(block, targetScale)
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
    }, [block, dispatchAction])

    const copyLink = useCallback(() => {
      const link = getUrlForBlock(parentConcept, block)
      saveTextToClipboard(link)
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [block, parentConcept, dispatchAction])

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
        <Section>
          <div className={styles.Title}>BACKGROUND</div>
          <div className={styles.TileButtonGroup}>
            <button
              key={'default'}
              className={styles.TileButton}
              onClick={() => setColor(undefined)}>
              <div className={styles.ColorTile} data-color="default" />
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
        </Section>
        <Section>
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
        </Section>
        <Section>
          <div className={styles.Title}>INFO</div>
          <div className={styles.InfoLines}>
            <InfoLine
              label="Created"
              value={getDateString(linkedConcept.createdTime)}
            />
            <InfoLine
              label="Updated"
              value={getDateString(linkedConcept.lastEditedTime)}
            />
          </div>
        </Section>
      </div>
    )
  }
)
