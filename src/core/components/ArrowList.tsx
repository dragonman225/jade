import * as React from 'react'
import { useContext, useMemo } from 'react'
import theme from '../../theme'
import { ContextType, PositionType } from '../interfaces'
import { Action } from '../store/actions'
import { AppStateContext } from '../store/appStateContext'
import { SystemContext } from '../store/systemContext'
import { boundingBoxOfBoxes, growBox } from '../utils'
import { blockToBox, findBlock } from '../utils/block'
import { Arrow } from './Arrow'
import { ViewObject } from './ViewObject'

const zeroSize = { w: 0, h: 0 }

export function ArrowList(): JSX.Element {
  const { relations, blocks } = useContext(AppStateContext)
  const { dispatchAction } = useContext(SystemContext)

  const fromBoxes = useMemo(
    () =>
      relations.map(relation => blockToBox(findBlock(blocks, relation.fromId))),
    [relations, blocks]
  )
  const toBoxes = useMemo(
    () =>
      relations.map(relation => blockToBox(findBlock(blocks, relation.toId))),
    [relations, blocks]
  )

  return (
    <>
      {relations.map((relation, index) => {
        const fromBox =
          fromBoxes[index] /*blockToBox(findBlock(blocks, relation.fromId))*/
        const toBox =
          toBoxes[index] /*blockToBox(findBlock(blocks, relation.toId))*/
        /** Grow box by 100 so that special arrows (e.g. top-top) don't overflow. */
        const viewBox = growBox(boundingBoxOfBoxes([fromBox, toBox]), 100)

        return (
          <ViewObject
            key={`vo-r-${relation.id}`}
            posType={PositionType.Normal}
            pos={viewBox}
            size={zeroSize}>
            <Arrow
              fromBox={fromBox}
              toBox={toBox}
              viewBox={viewBox}
              color={theme.colors.uiPrimaryHarder}
              size={theme.arrowSize}
              onMouseDown={e => {
                /** We only want right-click to open ContextMenu. */
                if (e.button !== 2) return
                const clientCoords = { x: e.clientX, y: e.clientY }
                dispatchAction({
                  type: Action.ContextMenuOpen,
                  data: {
                    contextType: ContextType.Relation,
                    pointerInViewportCoords: clientCoords,
                    relationId: relation.id,
                  },
                })
              }}
            />
          </ViewObject>
        )
      })}
    </>
  )
}
