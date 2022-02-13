import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { EditorView } from 'prosemirror-view'
import { Fragment, Slice } from 'prosemirror-model'

import {
  lastEditedTimeDescendingAndCanvasFirst,
  mapConceptToOption,
  pmtextOnly,
} from './utils'
import { KeywordObserver, createKeywordObserver } from './observeKeyword'
import { PMTextSchema, schema } from '../ProseMirrorSchema/schema'
import { LinkMark, linkMarkName } from '../ProseMirrorSchema/link'
import {
  HighlightMark,
  highlightMarkName,
} from '../ProseMirrorSchema/highlight'
import {
  getActiveHighlightColorFromSlice,
  getActiveMarksFromSlice,
} from '../TextActionMenu/utils'
import { getUrlForConcept } from '../../../core/utils/url'
import { createConcept } from '../../../core/utils/concept'
import {
  DatabaseInterface,
  FactoryRegistry,
  Rect,
  TypedConcept,
} from '../../../core/interfaces'
import { Transaction } from 'prosemirror-state'

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

export type OptionKey = [number, number]

type WithOptionKey<T> = {
  key: OptionKey
  item: T
}

export function flattenOptionGroups(
  optionGroups: OptionGroup[]
): WithOptionKey<Option>[] {
  return optionGroups.reduce<WithOptionKey<Option>[]>(
    (flattened, group, groupIdx) => {
      return flattened.concat(
        group.items.map((item, itemIdx) => ({
          key: [groupIdx, itemIdx],
          item,
        }))
      )
    },
    []
  )
}

function findPrevOption(
  currentOptionIndex: number,
  optionGroups: OptionGroup[]
): number {
  const flattenedOptions = flattenOptionGroups(optionGroups)
  if (currentOptionIndex > 0) return currentOptionIndex - 1
  else return flattenedOptions.length - 1
}

function findNextOption(
  currentOptionIndex: number,
  optionGroups: OptionGroup[]
): number {
  const flattenedOptions = flattenOptionGroups(optionGroups)
  if (currentOptionIndex < flattenedOptions.length - 1)
    return currentOptionIndex + 1
  else return 0
}

// TODO: Write stable interface
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSuggestionMenu(
  database: DatabaseInterface,
  factoryRegistry: FactoryRegistry,
  onInteractionEnd: () => void,
  onReplace: (type: string) => void,
  editorView: EditorView<PMTextSchema> | null | undefined
) {
  const [showSuggestionMenu, setShowSuggestionMenu] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [keywordRange, setKeywordRange] = useState({ from: 0, to: 0 })
  const [suggestFor, setSuggestFor] = useState(SuggestFor.SlashCommands)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [suggestionMenuAnchorRect, setSuggestionMenuAnchorRect] =
    useState<Rect>({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })

  const slashCommands = useMemo(
    () =>
      factoryRegistry.getContentFactories().map(f => ({
        id: f.id,
        title: f.name,
      })),
    [factoryRegistry]
  )

  const openSuggestionMenu = useCallback((f: SuggestFor) => {
    setShowSuggestionMenu(true)
    setSuggestFor(f)
  }, [])

  const closeSuggestionMenu = useCallback(() => {
    setShowSuggestionMenu(false)
    setKeyword('')
    setKeywordRange({ from: 0, to: 0 })
  }, [])

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  useEffect(() => {
    async function updateOptionGroups() {
      if (suggestFor === SuggestFor.SlashCommands) {
        const filteredSlashCommands = slashCommands.filter(c =>
          c.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
        )
        setOptionGroups([
          {
            id: OptionGroupType.TurnInto,
            title: 'Turn into',
            items: keyword ? filteredSlashCommands : slashCommands,
          },
        ])
      } else {
        const linkToOptionGroup: OptionGroup = {
          id: OptionGroupType.LinkTo,
          title: 'Insert link to',
          items: keyword
            ? database
                .searchConceptByText(keyword, { limit: 6 })
                .map(fuseResult =>
                  mapConceptToOption(factoryRegistry)(fuseResult.item)
                )
                .filter(o => !!o.title)
            : (await database.getAllConcepts())
                .filter(pmtextOnly)
                .sort(lastEditedTimeDescendingAndCanvasFirst)
                .slice(0, 6)
                .map(mapConceptToOption(factoryRegistry)),
        }
        const createOptionGroup: OptionGroup = {
          id: OptionGroupType.CreateAndLinkTo,
          title: 'Create and link to',
          items: [
            {
              id: 'create_and_link_to',
              title: `Create "${keyword}"`,
            },
          ],
        }
        setOptionGroups(
          keyword ? [linkToOptionGroup, createOptionGroup] : [linkToOptionGroup]
        )
      }
    }

    updateOptionGroups().catch(error => {
      throw error
    })
  }, [keyword, suggestFor, slashCommands, database, factoryRegistry])

  const updateKeyword = useCallback(
    (keyword: string, range: { from: number; to: number }) => {
      setKeyword(keyword)
      setKeywordRange(range)
    },
    []
  )

  const insertLinkToConcept = useCallback(
    (concept: TypedConcept<unknown>) => {
      if (!editorView) return
      const { from, to } = keywordRange
      const keywordSlice = editorView.state.doc.slice(from, to)
      const markActiveMap = getActiveMarksFromSlice(keywordSlice)
      const text = factoryRegistry.getConceptString(concept)
      const node = schema.text(
        text,
        Array.from(markActiveMap.keys())
          /** Existing link mark must be thrown away. */
          .filter(markType => markType.name !== linkMarkName)
          /** Inherit other marks. */
          .map(markType => {
            if (markType.name === highlightMarkName)
              return schema.mark(markType, {
                color: getActiveHighlightColorFromSlice(keywordSlice),
              } as HighlightMark['attrs'])
            return schema.mark(markType)
          })
          /** The new link mark. */
          .concat([
            schema.mark(schema.marks[linkMarkName], {
              href: getUrlForConcept(concept),
            } as LinkMark['attrs']),
          ])
      )
      const fragment = Fragment.from(node)
      const slice = new Slice(fragment, 0, 0)
      editorView.dispatch(editorView.state.tr.replaceRange(from, to, slice))
    },
    [editorView, factoryRegistry, keywordRange]
  )

  const confirmOption = useCallback(() => {
    const options = flattenOptionGroups(optionGroups)
    const [optionGroupIdx, optionIdx] =
      options[selectedOptionIndex] && options[selectedOptionIndex].key
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
        database
          .getConcept(option.id)
          .then(concept => {
            if (!concept) return
            insertLinkToConcept(concept)
          })
          .catch(error => {
            throw error
          })
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
  }, [
    database,
    closeSuggestionMenu,
    onInteractionEnd,
    onReplace,
    insertLinkToConcept,
    keyword,
    optionGroups,
    suggestFor,
    selectedOptionIndex,
  ])

  const selectOption = useCallback(
    (optionGroupIdx: number, optionIdx: number) => {
      const options = flattenOptionGroups(optionGroups)
      const selectedOptionIdx = options.findIndex(
        o => o.key[0] === optionGroupIdx && o.key[1] === optionIdx
      )
      if (selectedOptionIdx !== -1) setSelectedOptionIndex(selectedOptionIdx)
    },
    [optionGroups]
  )

  const selectPrevOption = useCallback(() => {
    setSelectedOptionIndex(currentOptionIndex =>
      findPrevOption(currentOptionIndex, optionGroups)
    )
  }, [optionGroups])

  const selectNextOption = useCallback(() => {
    setSelectedOptionIndex(currentOptionIndex =>
      findNextOption(currentOptionIndex, optionGroups)
    )
  }, [optionGroups])

  const rKeywordObserver = useRef<KeywordObserver>()
  if (!rKeywordObserver.current) {
    rKeywordObserver.current = createKeywordObserver({
      debug: false,
      rules: [
        {
          trigger: /\/$/,
          onTrigger: e => {
            openSuggestionMenu(SuggestFor.SlashCommands)
            setSuggestionMenuAnchorRect(e.keywordCoords.from)
            updateKeyword(e.keyword, {
              from: e.keywordRange.from - e.triggerString.length,
              to: e.keywordRange.to,
            })
          },
          onKeywordChange: e => {
            updateKeyword(e.keyword, {
              from: e.keywordRange.from - e.triggerString.length,
              to: e.keywordRange.to,
            })
          },
          onKeywordStop: closeSuggestionMenu,
        },
        {
          trigger: /(\[\[|@|「「)$/,
          onTrigger: e => {
            openSuggestionMenu(SuggestFor.Mention)
            setSuggestionMenuAnchorRect(e.keywordCoords.from)
            updateKeyword(e.keyword, {
              from: e.keywordRange.from - e.triggerString.length,
              to: e.keywordRange.to,
            })
          },
          onKeywordChange: e => {
            updateKeyword(e.keyword, {
              from: e.keywordRange.from - e.triggerString.length,
              to: e.keywordRange.to,
            })
          },
          onKeywordStop: closeSuggestionMenu,
        },
      ],
    })
  }

  useEffect(() => {
    if (!showSuggestionMenu && editorView)
      rKeywordObserver.current?.reset(
        editorView.state,
        editorView.dispatch.bind(null) as (
          tr: Transaction<PMTextSchema>
        ) => void
      )
  }, [showSuggestionMenu, editorView])

  useEffect(() => {
    /** If selected option is out of range, reset it. */
    const options = flattenOptionGroups(optionGroups)
    const selectedOption = options[selectedOptionIndex]
    if (!selectedOption) setSelectedOptionIndex(0)
  }, [optionGroups, selectedOptionIndex])

  return {
    models: {
      showSuggestionMenu,
      optionGroups,
      suggestFor,
      selectedOptionIndex,
      suggestionMenuAnchorRect,
    },
    operations: {
      openSuggestionMenu,
      closeSuggestionMenu,
      updateKeyword,
      confirmOption,
      selectOption,
      selectPrevOption,
      selectNextOption,
    },
    utils: {
      /** Stable across the lifetime of the component that use this hook. */
      keywordObserver: rKeywordObserver.current,
    },
  }
}
