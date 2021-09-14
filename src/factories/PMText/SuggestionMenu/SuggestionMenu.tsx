import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { classes } from 'typestyle'

import { styles } from './SuggestionMenu.styles'
import { Option, OptionGroup } from './useSuggestionMenu'

interface Props {
  width?: number
  optionGroups: OptionGroup[]
  closeMenu: () => void
}

type WithAbsoluteIndex<T> = {
  key: [number, number]
  item: T
}

function flattenOptionGroups(
  optionGroups: OptionGroup[]
): WithAbsoluteIndex<Option>[] {
  return optionGroups.reduce<WithAbsoluteIndex<Option>[]>(
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
  currentOption: [number, number],
  optionGroups: OptionGroup[]
): [number, number] {
  const flattenedOptions = flattenOptionGroups(optionGroups)
  const currentIdx = flattenedOptions.findIndex(
    o => o.key[0] === currentOption[0] && o.key[1] === currentOption[1]
  )
  if (currentIdx > 0) return flattenedOptions[currentIdx - 1].key
  else return flattenedOptions[flattenedOptions.length - 1].key
}

function findNextOption(
  currentOption: [number, number],
  optionGroups: OptionGroup[]
) {
  const flattenedOptions = flattenOptionGroups(optionGroups)
  const currentIdx = flattenedOptions.findIndex(
    o => o.key[0] === currentOption[0] && o.key[1] === currentOption[1]
  )
  if (currentIdx < flattenedOptions.length - 1)
    return flattenedOptions[currentIdx + 1].key
  else return flattenedOptions[0].key
}

export const SuggestionMenu = React.forwardRef<HTMLDivElement, Props>(
  function SuggestionMenu(
    { width, optionGroups, closeMenu },
    ref
  ): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<[number, number]>(
      () => {
        if (optionGroups[0] && optionGroups[0].items[0]) return [0, 0]
        else return [-1, -1]
      }
    )
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowUp': {
            setSelectedOption(o => findPrevOption(o, optionGroups))
            break
          }
          case 'ArrowDown': {
            setSelectedOption(o => findNextOption(o, optionGroups))
            break
          }
          case 'Enter': {
            optionGroups[selectedOption[0]]?.items[selectedOption[1]]?.perform()
            break
          }
          case 'Escape': {
            closeMenu()
            break
          }
        }
      },
      [optionGroups, selectedOption, closeMenu]
    )

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    useEffect(() => {
      if (!optionGroups[selectedOption[0]]?.items[selectedOption[1]]) {
        setSelectedOption([0, 0])
      }
    }, [optionGroups, selectedOption])

    return (
      <div
        ref={ref}
        className={styles.SuggestionMenu}
        style={{ width: width || 150 }}>
        {optionGroups.map((optionGroup, optionGroupIdx) => (
          <div key={optionGroupIdx}>
            <p className={styles.OptionGroupTitle}>{optionGroup.title}</p>
            {optionGroup.items.map((option, optionIdx) => (
              <div
                key={option.title}
                className={classes(
                  styles.Option,
                  optionGroupIdx === selectedOption[0] &&
                    optionIdx === selectedOption[1] &&
                    styles.Selected
                )}
                /**
                 * Can't use pure CSS since there's a case where the user
                 * hover an option and hit Enter on the keyboard to select
                 * it.
                 */
                onMouseEnter={() =>
                  setSelectedOption([optionGroupIdx, optionIdx])
                }
                onClick={option.perform}>
                {option.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
)
