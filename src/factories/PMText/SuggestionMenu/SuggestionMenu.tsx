import * as React from 'react'
import { useCallback, useEffect } from 'react'
import { classes } from 'typestyle'

import { styles } from './SuggestionMenu.styles'
import {
  flattenOptionGroups,
  OptionKey,
  OptionGroup,
} from './useSuggestionMenu'

interface Props {
  optionGroups: OptionGroup[]
  selectedOptionIndex: number
  width?: number
  onCloseMenu?: () => void
  onConfirmOption?: () => void
  onSelectOption?: (optionGroupIdx: number, optionIdx: number) => void
  onSelectPrevOption?: () => void
  onSelectNextOption?: () => void
}

function isSelectedOption(
  selectedOptionIndex: number,
  optionKey: OptionKey,
  optionGroups: OptionGroup[]
): boolean {
  const options = flattenOptionGroups(optionGroups)
  const selectedOption = options[selectedOptionIndex]
  return (
    !!selectedOption &&
    selectedOption.key[0] == optionKey[0] &&
    selectedOption.key[1] === optionKey[1]
  )
}

export const SuggestionMenu = React.forwardRef<HTMLDivElement, Props>(
  function SuggestionMenu(
    {
      optionGroups,
      selectedOptionIndex,
      width,
      onCloseMenu,
      onConfirmOption,
      onSelectOption,
      onSelectPrevOption,
      onSelectNextOption,
    },
    ref
  ): JSX.Element {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowUp': {
            onSelectPrevOption && onSelectPrevOption()
            break
          }
          case 'ArrowDown': {
            onSelectNextOption && onSelectNextOption()
            break
          }
          case 'Enter': {
            onConfirmOption && onConfirmOption()
            break
          }
          case 'Escape': {
            onCloseMenu && onCloseMenu()
            break
          }
        }
      },
      [onCloseMenu, onConfirmOption, onSelectPrevOption, onSelectNextOption]
    )

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
      <div
        ref={ref}
        className={styles.SuggestionMenu}
        style={{ width: width || 150 }}>
        {optionGroups.map((optionGroup, optionGroupIdx) => (
          <div key={optionGroup.id}>
            <div className={styles.OptionGroupTitle}>{optionGroup.title}</div>
            {optionGroup.items.map((option, optionIdx) => (
              <div
                key={option.id}
                className={classes(
                  styles.Option,
                  isSelectedOption(
                    selectedOptionIndex,
                    [optionGroupIdx, optionIdx],
                    optionGroups
                  ) && styles.Selected
                )}
                /**
                 * Can't use pure CSS since there's a case where the user
                 * hover an option and hit Enter on the keyboard to select
                 * it.
                 */
                onMouseEnter={() =>
                  onSelectOption && onSelectOption(optionGroupIdx, optionIdx)
                }
                onClick={() => onConfirmOption && onConfirmOption()}>
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
