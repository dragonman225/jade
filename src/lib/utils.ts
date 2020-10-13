import { BlockCard, BlockCardRef, BlockModel, Vec2 } from '../interfaces'

export function getMouseOffset(e: React.MouseEvent): Vec2 {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

export function adaptToBlockModel(
  block: BlockCard, blockRef: BlockCardRef): BlockModel<unknown> {
  return {
    id: block.id,
    type: block.type,
    content: block.content,
    position: blockRef.position,
    width: blockRef.width
  }
}

export function adaptToBlockCard(
  currentBlockCard: BlockCard,
  referencedBlockCard: BlockCard,
  newData: BlockModel<unknown>): {
    newCurrentBlockCard: BlockCard
    newReferencedBlockCard: BlockCard
  } {
  const newType = newData.type
  const newContent = newData.content
  const newReferences = currentBlockCard.blocks.map(block => {
    if (block.id === newData.id)
      return {
        ...block,
        position: newData.position,
        width: newData.width
      }
    else
      return block
  })
  if (currentBlockCard.id === referencedBlockCard.id) {
    const newBlockCard: BlockCard = {
      ...currentBlockCard,
      type: newType,
      content: newContent,
      blocks: newReferences
    }
    return {
      newCurrentBlockCard: newBlockCard,
      newReferencedBlockCard: newBlockCard
    }
  } else {
    return {
      newCurrentBlockCard: {
        ...currentBlockCard,
        blocks: newReferences
      },
      newReferencedBlockCard: {
        ...referencedBlockCard,
        type: newType,
        content: newContent
      }
    }
  }
}