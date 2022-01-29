import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { classes } from 'typestyle'

import { styles } from './ContextMenu.styles'
import { InfoLine } from './InfoLine'
import { Section } from './Section'
import { ContextForBlock, ListOption } from './types'
import { BlockColor } from '../../interfaces'
import { Action } from '../../store/actions'
import { useAppState } from '../../store/appStateContext'
import { useSystem } from '../../store/systemContext'
import { getDateString } from '../../utils'
import { getFocusForBlock } from '../../utils/block'
import { saveTextToClipboard } from '../../utils/clipboard'
import { getUrlForBlock } from '../../utils/url'
import { useConcept } from '../../utils/useConcept'

interface Props {
  context: ContextForBlock
}

export const ContextMenuForBlock = React.forwardRef<HTMLDivElement, Props>(
  function ContextMenuForBlock({ context }, ref) {
    const { block } = context
    const { settings, selectedBlockIds, viewingConcept } = useAppState()
    const { dispatchAction } = useSystem()
    const linkedConcept = useConcept(block.conceptId)

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
      const link = getUrlForBlock(viewingConcept, block)
      saveTextToClipboard(link)
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [block, viewingConcept, dispatchAction])

    const cutBlock = useCallback(() => {
      dispatchAction({
        type: Action.BlockCut,
      })
      dispatchAction({
        type: Action.ContextMenuClose,
      })
    }, [dispatchAction])

    const blockCount = selectedBlockIds.includes(block.id)
      ? selectedBlockIds.length
      : 1
    const isPlural = blockCount > 1
    /** "N blocks" or "the block" */
    const blockDescription = `${isPlural ? blockCount : 'the'} block${
      isPlural ? 's' : ''
    }`
    const actions = useMemo<ListOption[]>(
      () => [
        // {
        //   title: `Copy ${blockDescription}`,
        //   perform: copyBlock,
        // },
        {
          title: `Cut ${blockDescription}`,
          perform: cutBlock,
        },
        {
          title: `Delete ${blockDescription}`,
          perform: deleteBlock,
        },
        {
          title: `Focus ${blockDescription}`,
          perform: focusBlock,
        },
        {
          title: 'Copy link',
          perform: copyLink,
        },
      ],
      [focusBlock, copyLink, deleteBlock, cutBlock, blockDescription]
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
              value={getDateString(linkedConcept?.createdTime)}
            />
            <InfoLine
              label="Updated"
              value={getDateString(linkedConcept?.lastEditedTime)}
            />
            {settings.shouldEnableDevMode && (
              <>
                <InfoLine
                  label="Widget Type"
                  value={linkedConcept?.references.length ? 'Canvas' : 'Block'}
                />
                <InfoLine label="Widget ID" value={block.id} />
                <InfoLine
                  label="Content Type"
                  value={linkedConcept?.summary.type}
                />
                <InfoLine label="Content ID" value={block.conceptId} />{' '}
              </>
            )}
          </div>
        </Section>
      </div>
    )
  }
)
