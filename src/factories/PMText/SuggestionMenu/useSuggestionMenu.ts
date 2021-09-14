import { useCallback, useState, useMemo, useEffect } from 'react'
import { EditorView } from 'prosemirror-view'
import { Fragment, Slice } from 'prosemirror-model'

import { resetKeywordObserver } from './observeKeyword'
import { schema } from '../ProseMirrorSchema/schema'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'
import { getUrlForConcept } from '../../../core/utils/url'
import { DatabaseInterface, FactoryRegistry } from '../../../core/interfaces'

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
  onReplace: (type: string) => void,
  editorView: EditorView
) {
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [keywordRange, setKeywordRangeInner] = useState({ from: 0, to: 0 })
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const concepts = useMemo(() => database.getAllConcepts(), [database, keyword])

  const openSuggestionMenu = useCallback((f: SuggestFor) => {
    setShowSuggestionMenu(true)
    setSuggestFor(f)
  }, [])

  const closeSuggestionMenu = useCallback(() => {
    setShowSuggestionMenu(false)
    setKeyword('')
    setKeywordRangeInner({ from: 0, to: 0 })
  }, [])

  const optionGroupsThatDontCloseMenu = useMemo(() => {
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
            // HACK: Support text only
            .filter(c => c.summary.type === 'pmtext')
            /** Search with keyword. */
            .filter(c =>
              factoryRegistry
                .getConceptString(c)
                .toLocaleLowerCase()
                .includes(keyword.toLocaleLowerCase())
            )
            .map(c => ({
              title: factoryRegistry.getConceptString(c),
              perform: () => {
                const { from, to } = keywordRange
                const text = factoryRegistry.getConceptString(c)
                const node = schema.text(text, [
                  schema.mark(schema.marks[linkMarkName], {
                    href: getUrlForConcept(c),
                  } as LinkMark['attrs']),
                ])
                const fragment = Fragment.from(node)
                const slice = new Slice(fragment, 0, 0)
                editorView.dispatch(
                  editorView.state.tr.replaceRange(from, to, slice)
                )
              },
            }))
            .filter(o => !!o.title)
            .slice(0, 6),
        },
      ]
    }
  }, [
    keyword,
    keywordRange,
    suggestFor,
    slashCommands,
    concepts,
    factoryRegistry,
    editorView,
  ])

  /**
   * Let the user pass this to the UI component so that menu is
   * automatically closed on perform action.
   */
  const optionGroups = useMemo(
    () =>
      optionGroupsThatDontCloseMenu.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          perform: () => {
            closeSuggestionMenu()
            item.perform()
          },
        })),
      })),
    [closeSuggestionMenu, optionGroupsThatDontCloseMenu]
  )

  const setKeywordRange = useCallback((range: { from: number; to: number }) => {
    setKeywordRangeInner(range)
  }, [])

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
      setKeyword,
      setKeywordRange,
    },
  }
}
