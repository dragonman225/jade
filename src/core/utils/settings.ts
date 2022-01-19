import { Settings } from '../interfaces'

const INITIAL_HOME_ID = 'home'

export function migrateSettings(settings: Settings): Settings {
  return {
    homeConceptId: settings.homeConceptId || INITIAL_HOME_ID,
    viewingConceptId: settings.viewingConceptId || INITIAL_HOME_ID,
    shouldEnableDevMode:
      typeof settings.shouldEnableDevMode === 'undefined'
        ? false
        : settings.shouldEnableDevMode,
    shouldEnableEfficientRendering:
      typeof settings.shouldEnableEfficientRendering === 'undefined'
        ? true
        : settings.shouldEnableEfficientRendering,
  }
}
