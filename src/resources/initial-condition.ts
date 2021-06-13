import { v4 as uuidv4 } from 'uuid'

import { Concept, PositionType } from '../core/interfaces'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const contentConcepts = require('./initial-concepts.json') as Concept[]
const toolConcepts: Concept[] = [
  {
    id: uuidv4(),
    summary: { type: 'searchtool', data: { initialized: false } },
    references: [],
    drawing: [],
  },
  {
    id: uuidv4(),
    summary: { type: 'headertool', data: { initialized: false } },
    references: [],
    drawing: [],
  },
  {
    id: uuidv4(),
    summary: { type: 'recenttool', data: { initialized: false } },
    references: [],
    drawing: [],
  },
  {
    id: uuidv4(),
    summary: { type: 'insighttool', data: { initialized: false } },
    references: [],
    drawing: [],
  },
]
const toolMaskConcept: Concept = {
  id: '__tool_mask__',
  summary: { type: 'toolmask', data: { initialized: false } },
  references: [
    {
      id: uuidv4(),
      to: toolConcepts[0].id,
      posType: PositionType.PinnedTL,
      pos: { x: 16, y: 16 },
      size: { w: 300, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[1].id,
      posType: PositionType.PinnedTL,
      pos: { x: 370, y: 16 },
      size: { w: 470, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[2].id,
      posType: PositionType.PinnedTR,
      pos: { x: 16, y: 16 },
      size: { w: 500, h: 'auto' },
    },
    {
      id: uuidv4(),
      to: toolConcepts[3].id,
      posType: PositionType.PinnedBL,
      pos: { x: 16, y: 16 },
      size: { w: 250, h: 'auto' },
    },
  ],
  drawing: [],
}

export default contentConcepts
  // COMPAT: v0.1.4 or lower doesn't have `posType`.
  .map(c => ({
    ...c,
    references: c.references.map(r => ({
      ...r,
      posType:
        typeof r.posType === 'undefined' ? PositionType.Normal : r.posType,
    })),
  }))
  .concat(toolConcepts, toolMaskConcept)
