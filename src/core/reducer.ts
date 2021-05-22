import { v4 as uuidv4 } from 'uuid'
import { factoryRegistry } from '../factories'
import {
  BaseConceptData,
  Concept,
  ConceptId,
  ConceptDetail,
  DatabaseInterface,
  Link,
  PositionType,
  State4,
  Stroke,
  Vec2,
  Block,
  InteractionMode,
} from './interfaces'
import { viewportCoordsToEnvCoords, vecDiv, vecSub, vecAdd } from './lib/utils'
import initialConcepts from '../resources/initial-condition'

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
    positionInEnvCoords?: Vec2
    movementInViewportCoords?: Vec2
  }
}

interface RefResizeAction {
  type: 'ref::resize'
  data: {
    /** Link id. */
    id: string
    sizeInEnvCoords?: Vec2
    movementInViewportCoords?: Vec2
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

interface SelectionAddAction {
  type: 'selection::add'
  data: ConceptId[]
}

interface SelectionRemoveAction {
  type: 'selection::remove'
  data: ConceptId[]
}

interface SelectionClearAction {
  type: 'selection::clear'
}

interface ExpandAction {
  type: 'navigation::expand'
  data: {
    id: string
  }
}

interface BlockChangeAction {
  type: 'block::change'
  data: Block
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
  | SelectionAddAction
  | SelectionRemoveAction
  | SelectionClearAction
  | ExpandAction
  | BlockChangeAction
  | DebuggingToggleAction

export function synthesizeView(
  viewingConcept: Concept,
  db: DatabaseInterface
): ConceptDetail[] {
  const conceptId = '__tool_mask__'
  return Concept.details(viewingConcept, db).concat(
    viewingConcept.id !== conceptId
      ? Concept.details(db.getConcept(conceptId), db)
      : []
  )
}

export function loadAppState(db: DatabaseInterface): State4 {
  console.log('Loading app state.')
  if (!db.isValid()) {
    db.init(
      {
        debugging: false,
        homeConceptId: 'home',
        viewingConceptId: 'home',
      },
      initialConcepts
    )
  }
  const settings = db.getSettings()
  const viewingConcept = db.getConcept(settings.viewingConceptId)
  const viewingConceptDetails = synthesizeView(viewingConcept, db)
  return {
    debugging: settings.debugging,
    homeConceptId: settings.homeConceptId,
    viewingConcept,
    viewingConceptDetails,
    expandHistory: new Array(99).concat(viewingConcept.id) as (
      | ConceptId
      | undefined
    )[],
    camera: {
      focus: { x: 0, y: 0 },
      scale: 1,
    },
    selectedConceptRefs: [],
    blocks: viewingConceptDetails.map(l => ({
      id: l.link.id,
      mode: InteractionMode.Idle,
    })),
  }
}

export function createReducer(db: DatabaseInterface) {
  return function appStateReducer(state: State4, action: Action): State4 {
    // console.log(`reducer: "${action.type}"`, action)
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
          posType: PositionType.Normal,
          position: viewportCoordsToEnvCoords(
            action.data.position,
            state.camera
          ),
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
          blocks: state.blocks.concat({
            id: newLink.id,
            mode: InteractionMode.Idle,
          }),
        }
      }
      case 'ref::move': {
        const {
          id: linkId,
          positionInEnvCoords: requestedPos,
          movementInViewportCoords,
        } = action.data

        const oldPos = state.viewingConcept.details.find(l => l.id === linkId)
          .position

        const newPos = requestedPos
          ? requestedPos
          : movementInViewportCoords
          ? vecAdd(oldPos, vecDiv(movementInViewportCoords, state.camera.scale))
          : oldPos

        const newViewingConcept: Concept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
            if (linkId === link.id) {
              return {
                ...link,
                position: newPos,
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
        const {
          id: linkId,
          sizeInEnvCoords: requestedSize,
          movementInViewportCoords,
        } = action.data

        const oldSize = state.viewingConcept.details.find(l => l.id === linkId)
          .width

        // TODO: Support height and auto width / height
        const newSize = requestedSize
          ? requestedSize.x
          : movementInViewportCoords
          ? oldSize + movementInViewportCoords.x / state.camera.scale
          : oldSize

        const newViewingConcept = {
          ...state.viewingConcept,
          details: state.viewingConcept.details.map(link => {
            if (linkId === link.id) {
              return {
                ...link,
                width: newSize,
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
        const delta = vecDiv(action.data, state.camera.scale)
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
          viewportCoordsToEnvCoords(action.data.focus, state.camera),
          vecDiv(action.data.focus, nextScale)
        )
        if (nextScale === state.camera.scale) nextFocus = state.camera.focus

        return {
          ...state,
          camera: {
            ...state.camera,
            focus: nextFocus,
            scale: nextScale,
          },
        }
      }
      case 'selection::add': {
        return {
          ...state,
          selectedConceptRefs: state.selectedConceptRefs.concat(
            /** Just add those that are not selected. */
            action.data.filter(
              c => !state.selectedConceptRefs.find(sc => (sc = c))
            )
          ),
        }
      }
      case 'selection::remove': {
        return {
          ...state,
          selectedConceptRefs: state.selectedConceptRefs.filter(
            sc => !action.data.find(c => c === sc)
          ),
        }
      }
      case 'selection::clear': {
        return {
          ...state,
          selectedConceptRefs: [],
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
          posType: PositionType.Normal,
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
      case 'block::change': {
        const newBlock = action.data
        return {
          ...state,
          blocks: state.blocks
            .filter(b => b.id !== newBlock.id)
            .concat(newBlock),
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
