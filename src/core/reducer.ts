import { v4 as uuidv4 } from 'uuid'
import { factoryRegistry } from '../factories'
import {
  DatabaseInterface,
  State4,
  Vec2,
  Concept,
  BaseConceptData,
  Link,
  Stroke,
  ConceptDetail,
} from './interfaces'
import { viewportCoordsToEnvCoords, vecDiv, vecSub, vecMul } from './lib/utils'

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

interface RefCreateAction {
  type: 'ref::create'
  data: {
    id: string
    position: Vec2
  }
}

interface RefRemoveAction {
  type: 'ref::remove'
  data: {
    /** Link id. */
    id: string
  }
}

interface RefMoveAction {
  type: 'ref::move'
  data: {
    /** Link id. */
    id: string
    position: Vec2
  }
}

interface RefResizeAction {
  type: 'ref::resize'
  data: {
    /** Link id. */
    id: string
    width: number
  }
}

interface CameraMoveDeltaAction {
  type: 'cam::movedelta'
  data: Vec2
}

interface CameraScaleDeltaAction {
  type: 'cam::scaledelta'
  data: {
    focus: Vec2
    wheelDelta: number
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

export type Action =
  | ConceptCreateAction
  | ConceptDataChangeAction
  | ConceptDrawingChangeAction
  | RefCreateAction
  | RefRemoveAction
  | RefMoveAction
  | RefResizeAction
  | CameraMoveDeltaAction
  | CameraScaleDeltaAction
  | ExpandAction
  | DebuggingToggleAction

export function synthesizeView(
  viewingConcept: Concept,
  db: DatabaseInterface
): ConceptDetail[] {
  const overlayId = '__tool_mask__'
  return Concept.details(viewingConcept, db).concat(
    viewingConcept.id !== overlayId
      ? Concept.details(db.getConcept(overlayId), db)
      : []
  )
}

export function createReducer(db: DatabaseInterface) {
  return function appStateReducer(state: State4, action: Action): State4 {
    console.log('Action fired:', action.type)
    const defaultBlockWidth = 300
    switch (action.type) {
      case 'concept::create': {
        const newConcept: Concept = {
          id: uuidv4(),
          summary: {
            type: factoryRegistry.getDefaultContentFactory().id,
            data: { initialized: false },
          },
          details: [],
          drawing: [],
        }
        const newLink: Link = {
          id: uuidv4(),
          type: 'contains',
          to: newConcept.id,
          position: action.data.position,
          width: defaultBlockWidth,
        }
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.concat([newLink]),
        }
        db.updateConcept(newViewingConcept)
        db.createConcept(newConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: synthesizeView(newViewingConcept, db),
        }
      }
      case 'ref::move': {
        const linkId = action.data.id
        const newPosition = action.data.position
        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
            if (linkId === link.id) {
              return {
                ...link,
                position: newPosition,
              }
            } else {
              return link
            }
          }),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: synthesizeView(newViewingConcept, db),
        }
      }
      case 'ref::resize': {
        const linkId = action.data.id
        const newWidth = action.data.width
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
            if (linkId === link.id) {
              return {
                ...link,
                width: newWidth,
              }
            } else {
              return link
            }
          }),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: synthesizeView(newViewingConcept, db),
        }
      }
      case 'concept::datachange': {
        const newType = action.data.type
        const newData = action.data.content

        const concept = db.getConcept(action.data.id)

        db.updateConcept({
          ...concept,
          summary: {
            type: newType,
            data: newData,
          },
        })

        return {
          ...state,
          viewingConcept: db.getConcept(state.viewingConcept.id),
          viewingConceptDetails: synthesizeView(state.viewingConcept, db),
        }
      }
      case 'ref::remove': {
        // remove link only
        const linkId = action.data.id
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.filter(
            link => linkId !== link.id
          ),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: synthesizeView(newViewingConcept, db),
        }
      }
      case 'cam::movedelta': {
        const delta = action.data
        return {
          ...state,
          camera: {
            ...state.camera,
            focus: {
              x: state.camera.focus.x - delta.x,
              y: state.camera.focus.y - delta.y,
            },
          },
        }
      }
      case 'cam::scaledelta': {
        const minScale = 0.4
        const maxScale = 2
        /** Fibonacci scaling. */
        const ratio = Math.sqrt(1.618)
        /**
         * Calculate how many golden ratio (1.618) is going to be * or /.
         * Let's set 48px = 1 golden ratio.
         */
        const ratioExp = -action.data.wheelDelta / 48

        let nextScale = state.camera.scale * Math.pow(ratio, ratioExp)
        if (nextScale > maxScale) {
          nextScale = maxScale
        } else if (nextScale < minScale) {
          nextScale = minScale
        }

        let nextFocus = vecSub(
          viewportCoordsToEnvCoords(
            action.data.focus,
            state.camera.focus,
            state.camera.scale
          ),
          vecDiv(action.data.focus, nextScale)
        )
        if (nextScale === state.camera.scale) nextFocus = state.camera.focus

        console.log(
          nextScale,
          vecMul(
            vecSub(
              viewportCoordsToEnvCoords(
                action.data.focus,
                state.camera.focus,
                state.camera.scale
              ),
              vecDiv(action.data.focus, nextScale)
            ),
            nextScale
          )
        )

        return {
          ...state,
          camera: {
            ...state.camera,
            focus: nextFocus,
            scale: nextScale,
          },
        }
      }
      case 'navigation::expand': {
        const toConceptId = action.data.id

        if (toConceptId === state.viewingConcept.id) {
          return state
        }

        db.saveSettings({
          debugging: state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: toConceptId,
        })
        const concept = db.getConcept(toConceptId)
        return {
          ...state,
          viewingConcept: concept,
          viewingConceptDetails: synthesizeView(concept, db),
          expandHistory: state.expandHistory.slice(1).concat(toConceptId),
        }
      }
      case 'ref::create': {
        const link: Link = {
          id: uuidv4(),
          type: 'contains',
          to: action.data.id,
          position: action.data.position,
          width: defaultBlockWidth,
        }
        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.concat([link]),
        }
        db.updateConcept(newViewingConcept)
        return {
          ...state,
          viewingConcept: newViewingConcept,
          viewingConceptDetails: synthesizeView(newViewingConcept, db),
        }
      }
      case 'concept::drawingchange': {
        const concept = state.viewingConcept
        const conceptChanged = {
          ...concept,
          drawing: action.data,
        }
        db.updateConcept(conceptChanged)
        return {
          ...state,
          viewingConcept: conceptChanged,
        }
      }
      case 'debugging::toggle': {
        db.saveSettings({
          debugging: !state.debugging,
          homeConceptId: state.homeConceptId,
          viewingConceptId: state.viewingConcept.id,
        })
        return {
          ...state,
          debugging: !state.debugging,
        }
      }
    }
  }
}
