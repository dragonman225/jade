import { v4 as uuidv4 } from 'uuid'
import { config } from '../content-plugins/config'
import { DatabaseInterface, State4, Vec2 } from './interfaces'
import { Concept, BaseConceptData, Link, Stroke } from './interfaces/concept'

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

export function createReducer(db: DatabaseInterface) {
  return function appStateReducer(state: State4, action: Action): State4 {
    console.log('Action fired:', action.type)
    const defaultBlockWidth = 300
    switch (action.type) {
      case 'concept::create': {
        const newConcept: Concept = {
          id: uuidv4(),
          summary: {
            type: config.defaultType,
            data: { initialized: false }
          },
          details: [],
          drawing: []
        }
        const newLink: Link = {
          id: uuidv4(),
          type: 'contains',
          to: newConcept.id,
          position: action.data.position,
          width: defaultBlockWidth
        }
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.concat([newLink])
        }
        db.updateConcept(newViewingConcept)
        db.createConcept(newConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: Concept.details(newViewingConcept, db)
        }
      }
      case 'containslink::move': {
        const linkId = action.data.id
        const newPosition = action.data.position
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
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
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: Concept.details(newViewingConcept, db)
        }
      }
      case 'containslink::resize': {
        const linkId = action.data.id
        const newWidth = action.data.width
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
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
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: Concept.details(newViewingConcept, db)
        }
      }
      case 'concept::datachange': {
        const concept = db.getConcept(action.data.id)
        db.updateConcept({
          ...concept,
          summary: {
            type: action.data.type,
            data: action.data.content
          }
        })
        return {
          ...state,
          viewingConcept: db.getConcept(state.viewingConcept.id),
          viewingConceptDetails: Concept.details(state.viewingConcept, db)
        }
      }
      case 'link::remove': { // remove link only
        const linkId = action.data.id
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.filter(link => linkId !== link.id)
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: Concept.details(newViewingConcept, db)
        }
      }
      case 'navigation::expand': {
        const toConceptId = action.data.id
        db.saveSettings({
          debugging: state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: toConceptId
        })
        const concept = db.getConcept(toConceptId)
        return {
          ...state,
          viewingConcept: concept,
          viewingConceptDetails: Concept.details(concept, db)
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
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.concat([link])
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: Concept.details(newViewingConcept, db)
        }
      }
      case 'concept::drawingchange': {
        const concept = state.viewingConcept
        const conceptChanged = {
          ...concept,
          drawing: action.data
        }
        db.updateConcept(conceptChanged)
        return {
          ...state,
          viewingConcept: conceptChanged
        }
      }
      case 'debugging::toggle': {
        db.saveSettings({
          debugging: !state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: state.viewingConcept.id
        })
        return {
          ...state,
          debugging: !state.debugging
        }
      }
    }
  }
}