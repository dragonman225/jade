import { State } from '../interfaces'

const itemKey = 'state_v2'

export function loadState(): State | undefined {
  const blob = localStorage.getItem(itemKey)
  if (blob) {
    try {
      const state = JSON.parse(blob) as State
      return state
    } catch (err) {
      return undefined
    }
  } else {
    return undefined
  }
}

export function saveState(state: State): void {
  localStorage.setItem(itemKey, JSON.stringify(state))
}