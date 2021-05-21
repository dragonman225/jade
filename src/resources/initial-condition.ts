import { v4 as uuidv4 } from 'uuid'

import { Concept, PositionType } from '../core/interfaces'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const contentConcepts = require('../initial-concepts.json') as Concept[]
const toolConcepts: Concept[] = [
  {
    id: uuidv4(),
    summary: { type: 'searchtool', data: { initialized: false } },
    details: [],
    drawing: [],
  },
  {
    id: uuidv4(),
    summary: { type: 'headertool', data: { initialized: false } },
    details: [],
    drawing: [],
  },
]
const toolMaskConcept: Concept = {
  id: '__tool_mask__',
  summary: { type: 'toolmask', data: { initialized: false } },
  details: [
    {
      id: uuidv4(),
      type: 'contains',
      to: toolConcepts[0].id,
      posType: PositionType.PinnedTL,
      position: { x: 20, y: 20 },
      width: 300,
    },
    {
      id: uuidv4(),
      type: 'contains',
      to: toolConcepts[1].id,
      posType: PositionType.PinnedTL,
      position: { x: 370, y: 20 },
      width: 470,
    },
  ],
  drawing: [],
}

export default contentConcepts.concat(toolConcepts, toolMaskConcept)
