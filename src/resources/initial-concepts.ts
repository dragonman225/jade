import { v4 as uuidv4 } from 'uuid'

import { Concept, PositionType } from '../core/interfaces'

function createDefaultCamera() {
  return {
    focus: { x: 0, y: 0 },
    scale: 1,
  }
}

function createEmptyConcept(type: string): Concept {
  return {
    id: uuidv4(),
    summary: { type, data: { initialized: false } },
    references: [],
    drawing: [],
    camera: createDefaultCamera(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const contentConcepts = require('./initial-content-concepts.json') as Concept[]
export const toolConcepts: Concept[] = [
  createEmptyConcept('headertool'),
  createEmptyConcept('recenttool'),
  createEmptyConcept('insighttool'),
  createEmptyConcept('searchtool'),
]
export const toolMaskConcept: Concept = {
  id: '__tool_mask__',
  summary: { type: 'toolmask', data: { initialized: false } },
  references: [
    {
      id: uuidv4(),
      to: toolConcepts[0].id,
      posType: PositionType.PinnedTL,
      pos: { x: 400, y: 10 },
      size: { w: 450, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[1].id,
      posType: PositionType.PinnedTR,
      pos: { x: 10, y: 10 },
      size: { w: 450, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[2].id,
      posType: PositionType.PinnedBR,
      pos: { x: 10, y: 10 },
      size: { w: 250, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[3].id,
      posType: PositionType.PinnedTL,
      pos: { x: 10, y: 10 },
      size: { w: 270, h: 'auto' },
    },
  ],
  drawing: [],
  camera: createDefaultCamera(),
}

export const initialConcepts = contentConcepts
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
  }))
  .concat(
    contentConcepts.find(c => c.id === '__tool_mask__')
      ? []
      : toolConcepts.concat(toolMaskConcept)
  )
