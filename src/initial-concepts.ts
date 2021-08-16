import { createBlock } from './core/utils/block'
import { createConcept } from './core/utils/concept'
import { PositionType, TypedConcept } from './core/interfaces'

const now = Date.now()

function createDefaultCamera() {
  return {
    focus: { x: 0, y: 0 },
    scale: 1,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const initialConceptsFromFile = require('./initial-content-concepts.json') as TypedConcept<unknown>[]
export const toolConcepts: TypedConcept<unknown>[] = [
  createConcept('headertool'),
  createConcept('recenttool'),
  createConcept('insighttool'),
  createConcept('searchtool'),
]
export const toolMaskConcept: TypedConcept<unknown> = {
  id: '__tool_mask__',
  summary: { type: 'toolmask', data: undefined },
  references: [
    createBlock({
      to: toolConcepts[0].id,
      posType: PositionType.PinnedTL,
      pos: { x: 400, y: 10 },
      size: { w: 450, h: 'auto' },
    }),
    createBlock({
      to: toolConcepts[1].id,
      posType: PositionType.PinnedTR,
      pos: { x: 10, y: 10 },
      size: { w: 450, h: 'auto' },
    }),
    createBlock({
      to: toolConcepts[2].id,
      posType: PositionType.PinnedBR,
      pos: { x: 10, y: 10 },
      size: { w: 250, h: 'auto' },
    }),
    createBlock({
      to: toolConcepts[3].id,
      posType: PositionType.PinnedTL,
      pos: { x: 10, y: 10 },
      size: { w: 270, h: 'auto' },
    }),
  ],
  drawing: [],
  camera: createDefaultCamera(),
  createdTime: now,
  lastEditedTime: now,
}

export const initialConcepts = initialConceptsFromFile
  // COMPAT: v0.1.4 or lower doesn't have `posType`.
  // COMPAT: v0.1.4 or lower doesn't have `camera`.
  .map(c => ({
    ...c,
    references: c.references.map(r => ({
      ...r,
      posType:
        typeof r.posType === 'undefined' ? PositionType.Normal : r.posType,
    })),
    camera: c.camera || createDefaultCamera(),
    createdTime: c.createdTime || now,
    lastEditedTime: c.lastEditedTime || now,
  }))
  .concat(
    /**
     * If there's already `__tool_mask__` in the concepts from file,
     * there's no need to concat it.
     */
    initialConceptsFromFile.find(c => c.id === '__tool_mask__')
      ? []
      : toolConcepts.concat(toolMaskConcept)
  )
