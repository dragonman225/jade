import { v4 as uuidv4 } from 'uuid'

import { FactoryId, TypedConcept } from '../interfaces'

export function createConcept(
  type: FactoryId,
  properties: Partial<
    Omit<TypedConcept<unknown>, 'id' | 'createdTime' | 'lastEditedTime'>
  > = {}
): TypedConcept<unknown> {
  return {
    id: uuidv4(),
    summary: {
      type,
      data: {},
    },
    references: [],
    relations: [],
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
  concept: TypedConcept<unknown>,
  newProperties: Partial<
    Omit<TypedConcept<unknown>, 'id' | 'createdTime' | 'lastEditedTime'>
  >
): TypedConcept<unknown> {
  return {
    ...concept,
    ...newProperties,
    /**
     * Track only content changes. "camera", "drawing", "relations", and
     * "references" should be extracted to a new entity "Canvas".
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
