import { v4 as uuidv4 } from 'uuid'
import { BlockCard, BlockCardRef, State3, Stroke, Vec2 } from '../interfaces'

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

interface BlockLinkAction {
  type: 'block::link'
  data: {
    id: string
    position: Vec2
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
  BlockLinkAction |
  CanvasChangeAction | DebuggingToggleAction

/**
 * Generate a new state.
 * @param state - The old state.
 * @param action - The action to perform.
 */
export function appStateReducer(state: State3, action: Action): State3 {
  const defaultBlockWidth = 300
  switch (action.type) {
    case 'block::create': {
      const block: BlockCard = {
        id: uuidv4(),
        type: 'baby',
        content: null,
        drawing: [],
        blocks: []
      }
      const blockRef: BlockCardRef = {
        id: uuidv4(),
        to: block.id,
        position: action.data.position,
        width: defaultBlockWidth
      }
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [state.currentBlockCardId]: {
            ...state.blockCardMap[state.currentBlockCardId],
            blocks: state.blockCardMap[state.currentBlockCardId].blocks
              .concat([blockRef])
          },
          [block.id]: block
        }
      }
    }
    case 'block::move': {
      const toChange = state.currentBlockCardId
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
      const toChange = state.currentBlockCardId
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
      const toChange = state.currentBlockCardId
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
        currentBlockCardId: action.data.id
      }
    }
    case 'block::link': {
      const toChange = state.currentBlockCardId
      return {
        ...state,
        blockCardMap: {
          ...state.blockCardMap,
          [toChange]: {
            ...state.blockCardMap[toChange],
            blocks: state.blockCardMap[toChange].blocks
              .concat([{
                id: uuidv4(),
                to: action.data.id,
                position: action.data.position,
                width: defaultBlockWidth
              }])
          }
        }
      }
    }
    case 'canvas::change': {
      const toChange = state.currentBlockCardId
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