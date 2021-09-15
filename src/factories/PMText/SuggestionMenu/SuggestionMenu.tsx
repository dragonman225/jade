import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { classes } from 'typestyle'

import { styles } from './SuggestionMenu.styles'
import { Option, OptionGroup } from './useSuggestionMenu'

interface Props {
  optionGroups: OptionGroup[]
  width?: number
  onCloseMenu?: () => void
  onConfirmOption?: (option: [number, number]) => void
}

type OptionKey = [number, number]

type WithOptionKey<T> = {
  key: OptionKey
  item: T
}

function flattenOptionGroups(
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

function getResetOption(optionGroups: OptionGroup[]): OptionKey {
  if (optionGroups[0] && optionGroups[0].items[0]) return [0, 0]
  else return [-1, -1]
}

export const SuggestionMenu = React.forwardRef<HTMLDivElement, Props>(
  function SuggestionMenu(
    { optionGroups, width, onCloseMenu, onConfirmOption },
    ref
  ): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<[number, number]>(() =>
      getResetOption(optionGroups)
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
            onConfirmOption(selectedOption)
            break
          }
          case 'Escape': {
            onCloseMenu()
            break
          }
        }
      },
      [optionGroups, selectedOption, onCloseMenu, onConfirmOption]
    )

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    useEffect(() => {
      if (
        selectedOption[0] !== -1 &&
        !optionGroups[selectedOption[0]]?.items[selectedOption[1]]
      ) {
        setSelectedOption(getResetOption(optionGroups))
      }
    }, [optionGroups, selectedOption])

    return (
      <div
        ref={ref}
        className={styles.SuggestionMenu}
        style={{ width: width || 150 }}>
        {optionGroups.map((optionGroup, optionGroupIdx) => (
          <div key={optionGroupIdx}>
            <div className={styles.OptionGroupTitle}>{optionGroup.title}</div>
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
                onClick={() => onConfirmOption([optionGroupIdx, optionIdx])}>
                {option.title}
              </div>
            ))}
            {!optionGroup.items.length && (
              <div className={styles.Option}>No result</div>
            )}
          </div>
        ))}
      </div>
    )
  }
)
