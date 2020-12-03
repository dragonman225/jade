import { v4 as uuidv4 } from 'uuid'
import {
  BaseConceptData, Concept, ConceptId, ContainsLink,
  State3, Stroke, Vec2
} from '../interfaces'

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
        type: 'baby',
        data: { initialized: false },
        drawing: [],
        isMaterial: true
      }
      const link: ContainsLink = {
        id: uuidv4(),
        type: 'contains',
        from: state.viewingConceptId,
        to: concept.id,
        data: {
          position: action.data.position,
          width: defaultBlockWidth
        }
      }
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...state.conceptMap[state.viewingConceptId],
            isMaterial: false
          },
          [concept.id]: concept
        },
        linkMap: {
          ...state.linkMap,
          [link.id]: link
        }
      }
    }
    case 'containslink::move': {
      const linkId = action.data.id
      const newPosition = action.data.position
      const link = state.linkMap[linkId]
      return {
        ...state,
        linkMap: {
          ...state.linkMap,
          [linkId]: {
            ...link,
            data: {
              ...link.data,
              position: newPosition
            }
          }
        }
      }
    }
    case 'containslink::resize': {
      const linkId = action.data.id
      const newWidth = action.data.width
      const link = state.linkMap[linkId]
      return {
        ...state,
        linkMap: {
          ...state.linkMap,
          [linkId]: {
            ...link,
            data: {
              ...link.data,
              width: newWidth
            }
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
            type: action.data.type,
            data: action.data.content
          }
        }
      }
    }
    case 'link::remove': { // remove link only
      const linkId = action.data.id
      const { [linkId]: linkRemoved, ...newLinkMap } = state.linkMap
      return {
        ...state,
        linkMap: newLinkMap
      }
    }
    case 'navigation::expand': {
      return {
        ...state,
        viewingConceptId: action.data.id
      }
    }
    case 'link::create': {
      const link: ContainsLink = {
        id: uuidv4(),
        type: 'contains',
        from: state.viewingConceptId,
        to: action.data.id,
        data: {
          position: action.data.position,
          width: defaultBlockWidth
        }
      }
      return {
        ...state,
        conceptMap: {
          ...state.conceptMap,
          [state.viewingConceptId]: {
            ...state.conceptMap[state.viewingConceptId],
            isMaterial: false
          }
        },
        linkMap: {
          ...state.linkMap,
          [link.id]: link
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

type Details = {
  link: ContainsLink
  concept: Concept
}[]

export function getDetailsOfConcept(conceptId: ConceptId, state: State3): Details {
  const fromId = conceptId
  const linkType = 'contains'
  return Object.values(state.linkMap).filter(link => {
    return link.type === linkType && link.from === fromId
  }).map(link => {
    return {
      link,
      concept: state.conceptMap[link.to]
    }
  })
}