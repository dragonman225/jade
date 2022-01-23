import { Settings } from '../interfaces'

const INITIAL_HOME_ID = 'home'

export function getDefaultSettings(): Settings {
  return {
    homeConceptId: INITIAL_HOME_ID,
    viewingConceptId: INITIAL_HOME_ID,
    shouldEnableDevMode: false,
    shouldEnableEfficientRendering: true,
  }
}

export function migrateSettings(settings: Settings): Settings {
  const defaultSettings = getDefaultSettings()
  return {
    homeConceptId: settings.homeConceptId || defaultSettings.homeConceptId,
    viewingConceptId:
      settings.viewingConceptId || defaultSettings.viewingConceptId,
    shouldEnableDevMode:
      typeof settings.shouldEnableDevMode === 'undefined'
        ? defaultSettings.shouldEnableDevMode
        : settings.shouldEnableDevMode,
    shouldEnableEfficientRendering:
      typeof settings.shouldEnableEfficientRendering === 'undefined'
        ? defaultSettings.shouldEnableEfficientRendering
        : settings.shouldEnableEfficientRendering,
  }
}
