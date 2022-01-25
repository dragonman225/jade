import * as React from 'react'
import { useMemo } from 'react'
import { style } from 'typestyle'

import { Block } from './Block'
import { useSystem } from '../store/systemContext'
import theme from '../../theme'
import { BlockInstance, Concept, PositionType } from '../interfaces'
import { ConceptDriver } from './ConceptDriver'
import { useConcept } from '../utils/useConcept'

interface BlockDriverProps {
  block: BlockInstance
}

export const BlockDriver = React.memo(function BlockDriver({
  block,
}: BlockDriverProps): JSX.Element {
  const { dispatchAction } = useSystem()
  const concept = useConcept(block.conceptId)

  const blockClassName = useMemo(() => {
    return block.posType > PositionType.Normal
      ? style({
          boxShadow: theme.shadows.layer,
          borderRadius: theme.borders.largeRadius,
          background: theme.colors.bgCanvasSemiTransparent,
          backdropFilter: 'saturate(180%) blur(30px)',
        })
      : undefined
  }, [block.posType])

  return (
    <Block
      id={block.id}
      conceptId={block.conceptId}
      color={block.color}
      mode={block.mode}
      selected={block.selected}
      highlighted={block.highlighted}
      blink={concept ? Concept.isHighOrder(concept) : false}
      allowResizeWidth={block.size.w !== 'auto'}
      allowResizeHeight={block.size.h !== 'auto'}
      dispatchAction={dispatchAction}
      className={blockClassName}>
      <ConceptDriver block={block} concept={concept} />
    </Block>
  )
})
