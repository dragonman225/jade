import { v4 as uuidv4 } from 'uuid'

import { Concept, FactoryId } from '../interfaces'

export function createConcept(type: FactoryId): Concept {
  return {
    id: uuidv4(),
    summary: {
      type,
      data: { initialized: false },
    },
    references: [],
    drawing: [],
    camera: {
      focus: { x: 0, y: 0 },
      scale: 1,
    },
  }
}
