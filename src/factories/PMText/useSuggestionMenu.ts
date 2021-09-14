import { useCallback, useState, useMemo } from 'react'

import { DatabaseInterface, FactoryRegistry } from '../../core/interfaces'

export interface Option {
  title: string
  perform: () => void
}

export interface OptionGroup {
  title: string
  items: Option[]
}

export enum SuggestFor {
  SlashCommands = 'slashCommands',
  Mention = 'mention',
}

// TODO: Write stable interface
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSuggestionMenu(
  database: DatabaseInterface,
  factoryRegistry: FactoryRegistry,
  onInteractionEnd: () => void,
  onReplace: (type: string) => void
) {
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [suggestFor, setSuggestFor] = useState(SuggestFor.SlashCommands)

  const slashCommands = useMemo(
    () =>
      factoryRegistry.getContentFactories().map(f => ({
        title: f.name,
        perform: () => {
          onInteractionEnd()
          onReplace(f.id)
        },
      })),
    [factoryRegistry, onInteractionEnd, onReplace]
  )

  /** Re-fetch on keyword change. */
  const concepts = useMemo(() => database.getAllConcepts(), [database, keyword])

  const openSuggestionMenu = useCallback(() => {
    setShowSuggestionMenu(true)
  }, [])

  const closeSuggestionMenu = useCallback(() => {
    setShowSuggestionMenu(false)
  }, [])

  const optionGroups = useMemo(() => {
    if (suggestFor === SuggestFor.SlashCommands) {
      const filteredSlashCommands = slashCommands.filter(c =>
        c.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
      )
      return [
        {
          title: 'Turn into',
          items: keyword ? filteredSlashCommands : slashCommands,
        },
      ]
    } else {
      return [
        {
          title: 'Blocks',
          items: concepts
            .slice(0, 6)
            .map(c => ({ title: c.id, perform: () => console.log(c) })),
        },
      ]
    }
  }, [keyword, suggestFor, slashCommands, concepts])

  /**
   * Let the user pass this to the UI component so that menu is
   * automatically closed on perform action.
   */
  const decoratedOptionGroups = useMemo(
    () =>
      optionGroups.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          perform: () => {
            closeSuggestionMenu()
            item.perform()
          },
        })),
      })),
    [closeSuggestionMenu, optionGroups]
  )

  return {
    models: {
      showSuggestionMenu,
      decoratedOptionGroups,
      suggestFor,
    },
    operations: {
      openSuggestionMenu,
      closeSuggestionMenu,
      setKeyword,
      setSuggestFor,
    },
  }
}
