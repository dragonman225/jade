import * as React from 'react'

import { styles } from './DebugLabel.style'
import { BlockInstance, TypedConcept } from '../interfaces'

interface Props {
  block: BlockInstance
  concept: TypedConcept<unknown>
}

export function DebugLabel(props: Props): JSX.Element {
  const { block, concept } = props

  return (
    <div className={styles.DebugLabel}>
      id: {block.id}
      <br />
      mode: {block.mode}
      <br />
      posType: {block.posType}
      <br />
      pos: {`{ x: ${block.pos.x.toFixed(2)}, y: ${block.pos.y.toFixed(2)} }`}
      <br />
      selected: {block.selected ? 'true' : 'false'}
      <br />
      highlighted: {block.highlighted ? 'true' : 'false'}
      <br />
      createdTime: {block.createdTime}
      <br />
      lastEditedTime: {block.lastEditedTime}
      <br />
      concept.id: {concept.id}
      <br />
      concept.createdTime: {concept.createdTime}
      <br />
      concept.lastEditedTime: {concept.lastEditedTime}
    </div>
  )
}
