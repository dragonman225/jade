import { useCallback, useState, useMemo, useEffect } from 'react'
import { EditorView } from 'prosemirror-view'
import { Fragment, Slice } from 'prosemirror-model'

import {
  includeKeyword,
  lastEditedTimeDescending,
  mapConceptToOption,
  pmtextOnly,
} from './utils'
import { resetKeywordObserver } from './observeKeyword'
import { schema } from '../ProseMirrorSchema/schema'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'
import { getUrlForConcept } from '../../../core/utils/url'
import { createConcept } from '../../../core/utils/concept'
import {
  DatabaseInterface,
  FactoryRegistry,
  TypedConcept,
} from '../../../core/interfaces'

export interface Option {
  id: string
  title: string
}

export interface OptionGroup {
  id: string
  title: string
  items: Option[]
}

export enum SuggestFor {
  SlashCommands = 'slashCommands',
  Mention = 'mention',
}

enum OptionGroupType {
  TurnInto = 'turnInto',
  LinkTo = 'linkTo',
  CreateAndLinkTo = 'createAndLinkTo',
}

// TODO: Write stable interface
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSuggestionMenu(
  database: DatabaseInterface,
  factoryRegistry: FactoryRegistry,
  onInteractionEnd: () => void,
  onReplace: (type: string) => void,
  editorView: EditorView
) {
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [keywordRange, setKeywordRange] = useState({ from: 0, to: 0 })
  const [suggestFor, setSuggestFor] = useState(SuggestFor.SlashCommands)

  const slashCommands = useMemo(
    () =>
      factoryRegistry.getContentFactories().map(f => ({
        id: f.id,
        title: f.name,
      })),
    [factoryRegistry]
  )

  const [concepts, setConcepts] = useState<TypedConcept<unknown>[]>([])

  const openSuggestionMenu = useCallback((f: SuggestFor) => {
    setShowSuggestionMenu(true)
    setSuggestFor(f)
  }, [])

  const closeSuggestionMenu = useCallback(() => {
    setShowSuggestionMenu(false)
    setKeyword('')
    setKeywordRange({ from: 0, to: 0 })
  }, [])

  const optionGroups: OptionGroup[] = useMemo(() => {
    if (suggestFor === SuggestFor.SlashCommands) {
      const filteredSlashCommands = slashCommands.filter(c =>
        c.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
      )
      return [
        {
          id: OptionGroupType.TurnInto,
          title: 'Turn into',
          items: keyword ? filteredSlashCommands : slashCommands,
        },
      ]
    } else {
      return [
        {
          id: OptionGroupType.LinkTo,
          title: 'Link to',
          items: concepts
            // HACK: Support text only
            .filter(pmtextOnly)
            /** Search with keyword. */
            .filter(includeKeyword(keyword, factoryRegistry))
            .sort(lastEditedTimeDescending)
            .map(mapConceptToOption(factoryRegistry))
            .filter(o => !!o.title)
            .slice(0, 6),
        },
        {
          id: OptionGroupType.CreateAndLinkTo,
          title: 'Create and link to',
          items: [
            {
              id: 'create_and_link_to',
              title: `Create "${keyword}"`,
            },
          ],
        },
      ]
    }
  }, [keyword, suggestFor, slashCommands, concepts, factoryRegistry])

  useEffect(() => {
    if (suggestFor === SuggestFor.SlashCommands) return
    setConcepts(database.getAllConcepts())
  }, [keyword, suggestFor, database])

  const updateSuggestionMenu = useCallback(
    (keyword: string, range: { from: number; to: number }) => {
      setKeyword(keyword)
      setKeywordRange(range)
    },
    []
  )

  const insertLinkToConcept = useCallback(
    (concept: TypedConcept<unknown>) => {
      const text = factoryRegistry.getConceptString(concept)
      const node = schema.text(text, [
        schema.mark(schema.marks[linkMarkName], {
          href: getUrlForConcept(concept),
        } as LinkMark['attrs']),
      ])
      const fragment = Fragment.from(node)
      const slice = new Slice(fragment, 0, 0)
      const { from, to } = keywordRange
      editorView.dispatch(editorView.state.tr.replaceRange(from, to, slice))
    },
    [editorView, factoryRegistry, keywordRange]
  )

  const confirmOption = useCallback(
    ([optionGroupIdx, optionIdx]: [number, number]) => {
      const optionGroup = optionGroups[optionGroupIdx]
      const option = optionGroup && optionGroup.items[optionIdx]

      closeSuggestionMenu()

      if (!option) {
        return
      }

      if (suggestFor === SuggestFor.SlashCommands) {
        onInteractionEnd()
        onReplace(option.id)
      } else {
        if (optionGroup.id === OptionGroupType.LinkTo) {
          const concept = database.getConcept(option.id)
          insertLinkToConcept(concept)
        } else if (optionGroup.id === OptionGroupType.CreateAndLinkTo) {
          const concept = createConcept('pmtext', {
            summary: {
              type: 'pmtext',
              data: {
                initialized: true,
                data: {
                  type: 'doc',
                  content: [{ type: 'text', text: keyword }],
                },
              },
            },
          })
          insertLinkToConcept(concept)
          database.createConcept(concept)
        }
      }
    },
    [
      database,
      closeSuggestionMenu,
      onInteractionEnd,
      onReplace,
      insertLinkToConcept,
      keyword,
      optionGroups,
      suggestFor,
    ]
  )

  useEffect(() => {
    if (!showSuggestionMenu && editorView)
      resetKeywordObserver(editorView.state, editorView.dispatch.bind(null))
  }, [showSuggestionMenu, editorView])

  return {
    models: {
      showSuggestionMenu,
      optionGroups,
      suggestFor,
    },
    operations: {
      openSuggestionMenu,
      closeSuggestionMenu,
      updateSuggestionMenu,
      confirmOption,
    },
  }
}
