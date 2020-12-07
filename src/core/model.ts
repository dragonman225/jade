import { v4 as uuidv4 } from 'uuid'
import {
  BaseConceptData, Link,
  State3, Stroke, Vec2
} from './interfaces'
import { Concept } from './interfaces/concept'

interface ConceptCreateAction {
  type: 'concept::create'
  data: {
    position: Vec2
  }
}

interface ConceptDataChangeAction {
  type: 'concept::datachange'
  data: {
    id: string
    type: string
    content: BaseConceptData
  }
}

interface ConceptDrawingChangeAction {
  type: 'concept::drawingchange'
  data: Stroke[]
}

interface LinkCreateAction {
  type: 'link::create'
  data: {
    id: string
    position: Vec2
  }
}

interface LinkRemoveAction {
  type: 'link::remove'
  data: {
    id: string
  }
}

interface ContainsLinkMoveAction {
  type: 'containslink::move'
  data: {
    id: string
    position: Vec2
  }
}

interface ContainsLinkResizeAction {
  type: 'containslink::resize'
  data: {
    id: string
    width: number
  }
}

interface ExpandAction {
  type: 'navigation::expand'
  data: {
    id: string
  }
}

interface DebuggingToggleAction {
  type: 'debugging::toggle'
}

type Action =
  ConceptCreateAction | ConceptDataChangeAction | ConceptDrawingChangeAction |
  LinkCreateAction | LinkRemoveAction |
  ContainsLinkMoveAction | ContainsLinkResizeAction |
  ExpandAction | DebuggingToggleAction

/**
 * Generate a new state.
 * @param state - The old state.
 * @param action - The action to perform.
 */
export function appStateReducer(state: State3, action: Action): State3 {
  const defaultBlockWidth = 300
  switch (action.type) {
    case 'concept::create': {
      const concept: Concept = {
        id: uuidv4(),
        summary: {
          type: 'baby',
          data: { initialized: false }
        },
        details: [],
        drawing: []
      }
      const link: Link = {
        id: uuidv4(),
        type: 'contains',
        to: concept.id,
        position: action.data.position,
        width: defaultBlockWidth
      }
      const toChange = state.conceptMap[state.viewingConceptId]
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...toChange,
            details: toChange.details.concat([link])
          },
          [concept.id]: concept
        }
      }
    }
    case 'containslink::move': {
      const linkId = action.data.id
      const newPosition = action.data.position
      const toChange = state.conceptMap[state.viewingConceptId]
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...toChange,
            details: toChange.details.map(link => {
              if (linkId === link.id) {
                return {
                  ...link,
                  position: newPosition
                }
              } else {
                return link
              }
            })
          }
        }
      }
    }
    case 'containslink::resize': {
      const linkId = action.data.id
      const newWidth = action.data.width
      const toChange = state.conceptMap[state.viewingConceptId]
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...toChange,
            details: toChange.details.map(link => {
              if (linkId === link.id) {
                return {
                  ...link,
                  width: newWidth
                }
              } else {
                return link
              }
            })
          }
        }
      }
    }
    case 'concept::datachange': {
      const toChange = action.data.id
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [toChange]: {
            ...state.conceptMap[toChange],
            summary: {
              type: action.data.type,
              data: action.data.content
            }
          }
        }
      }
    }
    case 'link::remove': { // remove link only
      const linkId = action.data.id
      const toChange = state.conceptMap[state.viewingConceptId]
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...toChange,
            details: toChange.details.filter(link => linkId !== link.id)
          }
        }
      }
    }
    case 'navigation::expand': {
      return {
        ...state,
        viewingConceptId: action.data.id
      }
    }
    case 'link::create': {
      const link: Link = {
        id: uuidv4(),
        type: 'contains',
        to: action.data.id,
        position: action.data.position,
        width: defaultBlockWidth
      }
      const toChange = state.conceptMap[state.viewingConceptId]
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...toChange,
            details: toChange.details.concat([link])
          }
        }
      }
    }
    case 'concept::drawingchange': {
      const toChange = state.viewingConceptId
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [toChange]: {
            ...state.conceptMap[toChange],
            drawing: action.data
          }
        }
      }
    }
    case 'debugging::toggle': {
      return {
        ...state,
        debugging: state.debugging ? false : true
      }
    }
  }
}