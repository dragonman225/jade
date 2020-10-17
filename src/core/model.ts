import { v4 as uuidv4 } from 'uuid'
import { BlockCard, State3, Stroke, Vec2 } from '../interfaces'

interface BlockCreateAction {
  type: 'block::create'
  data: {
    position: Vec2
  }
}

interface BlockMoveAction {
  type: 'block::move'
  data: {
    id: string
    position: Vec2
  }
}

interface BlockResizeAction {
  type: 'block::resize'
  data: {
    id: string
    width: number
  }
}

interface BlockChangeAction {
  type: 'block::change'
  data: BlockCard
}

interface BlockRemoveAction {
  type: 'block::remove'
  data: {
    id: string
  }
}

interface BlockExpandAction {
  type: 'block::expand'
  data: {
    id: string
  }
}

interface CanvasChangeAction {
  type: 'canvas::change'
  data: Stroke[]
}

interface DebuggingToggleAction {
  type: 'debugging::toggle'
}

type Action =
  BlockCreateAction | BlockMoveAction |
  BlockResizeAction | BlockChangeAction |
  BlockRemoveAction | BlockExpandAction |
  CanvasChangeAction | DebuggingToggleAction

/**
 * Generate a new state.
 * @param state - The old state.
 * @param action - The action to perform.
 */
export function appStateReducer(state: State3, action: Action): State3 {
  switch (action.type) {
    case 'block::create': {
      const block: BlockCard = {
        id: uuidv4(),
        type: 'baby',
        content: null,
        drawing: [],
        blocks: []
      }
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [state.currentBlockCard]: {
            ...state.blockCardMap[state.currentBlockCard],
            blocks: state.blockCardMap[state.currentBlockCard].blocks.concat([{
              id: block.id,
              position: action.data.position,
              width: 300
            }])
          },
          [block.id]: block
        }
      }
    }
    case 'block::move': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks.map(block => {
              if (block.id === action.data.id) {
                return {
                  ...block,
                  position: action.data.position
                }
              } else {
                return block
              }
            })
          }
        }
      }
    }
    case 'block::resize': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks.map(block => {
              if (block.id === action.data.id) {
                return {
                  ...block,
                  width: action.data.width
                }
              } else {
                return block
              }
            })
          }
        }
      }
    }
    case 'block::change': {
      const toChange = action.data.id
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: action.data
        }
      }
    }
    case 'block::remove': { // remove reference only
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks
              .filter(block => block.id !== action.data.id)
          }
        }
      }
    }
    case 'block::expand': {
      return {
        ...state,
        currentBlockCard: action.data.id
      }
    }
    case 'canvas::change': {
      const toChange = state.currentBlockCard
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
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