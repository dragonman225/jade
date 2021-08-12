import { v4 as uuidv4 } from 'uuid'

import { Concept, FactoryId } from '../interfaces'

export function createConcept(
  type: FactoryId,
  properties: Partial<
    Pick<Concept, 'camera' | 'drawing' | 'references' | 'summary'>
  > = {}
): Concept {
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
    createdTime: Date.now(),
    lastEditedTime: Date.now(),
    ...properties,
  }
}

export function updateConcept(
  concept: Concept,
  newProperties: Partial<
    Pick<Concept, 'camera' | 'drawing' | 'references' | 'summary'>
  >
): Concept {
  return {
    ...concept,
    ...newProperties,
    /**
     * Track only content changes. "camera", "drawing", and "references"
     * should be extracted to a new entity "Canvas".
     *
     * Why calling from prototype?
     * @see https://eslint.org/docs/rules/no-prototype-builtins
     */
    lastEditedTime: Object.prototype.hasOwnProperty.call(
      newProperties,
      'summary'
    )
      ? Date.now()
      : concept.lastEditedTime,
  }
}
