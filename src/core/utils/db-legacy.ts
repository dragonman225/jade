import { State3 } from '../interfaces'

/** Legacy database implemented with localStorage. */
const itemKey = 'state_v3'

export function legacyLoadState(): State3 | undefined {
  const blob = localStorage.getItem(itemKey)
  if (blob) {
    try {
      const state = JSON.parse(blob) as State3
      return state
    } catch (err) {
      return undefined
    }
  } else {
    return undefined
  }
}

export function legacySaveState(state: State3): void {
  localStorage.setItem(itemKey, JSON.stringify(state))
}
