import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { styles } from './index.styles'
import { MoreHoriz } from '../../core/components/Icons/MoreHoriz'
import { useSettings } from '../../core/store/contexts'
import { useSystem } from '../../core/store/systemContext'
import { getUrlForConceptId } from '../../core/utils/url'
import { saveTextToClipboard } from '../../core/utils/clipboard'
import { Action } from '../../core/store/actions'

export const More = React.memo(function More() {
  const settings = useSettings()
  const { createOverlay, dispatchAction } = useSystem()
  const rButtonEl = useRef<HTMLButtonElement>(null)
  const rMenuEl = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => setIsOpen(isOpen => !isOpen), [])

  /** Click outside to close menu. */
  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (
        !rButtonEl.current?.contains(e.target as Node) &&
        !rMenuEl.current?.contains(e.target as Node)
      )
        setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', onPointerDown)
      document.addEventListener('touchstart', onPointerDown)

      return () => {
        document.removeEventListener('mousedown', onPointerDown)
        document.removeEventListener('touchstart', onPointerDown)
      }
    }

    return // to suppress type error
  }, [isOpen])

  /** Menu item actions. */
  const copyLinkToCanvas = useCallback(() => {
    const url = getUrlForConceptId(settings.viewingConceptId)
    saveTextToClipboard(url)
    setIsOpen(false)
  }, [settings.viewingConceptId])

  const setAsHome = useCallback(() => {
    if (settings.viewingConceptId !== settings.homeConceptId) {
      dispatchAction({
        type: Action.SettingsSet,
        data: {
          homeConceptId: settings.viewingConceptId,
        },
      })
    }
    setIsOpen(false)
  }, [settings.homeConceptId, settings.viewingConceptId, dispatchAction])

  return (
    <>
      <button ref={rButtonEl} className={styles.Button} onClick={toggleMenu}>
        {/** Set as home, Connect to Unigraph (independent, not merged with SQLite),
         *  Export as JSON, Export as Webpage, Export as Markdown, Export as DOCX, Dark Mode. */}
        <MoreHoriz />
      </button>
      {isOpen &&
        createOverlay(
          <div
            ref={rMenuEl}
            className={styles.menu}
            style={{
              transform: getMenuCssTransform(rButtonEl.current, 216),
              width: 216,
            }}>
            <button className={styles.menuItem} onClick={copyLinkToCanvas}>
              Copy link to Canvas
            </button>
            {/* <button className={styles.menuItem}>Save Canvas as file</button> */}
            <button className={styles.menuItem} onClick={setAsHome}>
              Set as home
            </button>
          </div>
        )}
    </>
  )
})

function getMenuCssTransform(
  buttonEl: HTMLButtonElement | null,
  menuWidth: number
) {
  const rect = buttonEl?.getBoundingClientRect()
  if (!rect) return ''
  return `translate(${(rect.left + rect.right) / 2 - menuWidth / 2}px, ${
    rect.bottom + 5
  }px)`
}
