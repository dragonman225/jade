import * as React from 'react'
import { useState, useEffect } from 'react'
import { IPubSub } from '../lib/pubsub'
import { UnifiedEventInfo } from '../interfaces'

export interface InputContainerProps {
  messenger: IPubSub
}

/**
 * A container for global event delegation.
 * This container acts as a centralized place to receive raw events, 
 * convert them to app-specific messages, so that other components can 
 * use them easily.
 * This design also enables sharing events between components.
 * @param props 
 */
export function InputContainer(
  props: React.PropsWithChildren<InputContainerProps>): JSX.Element {
  const messenger = props.messenger
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    window.onresize = () => {
      messenger.publish('user::resizewindow')
    }
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        messenger.publish('user::ctrlkeydown')
      } else if (e.ctrlKey && e.shiftKey && e.altKey && e.key === 'D') {
        messenger.publish('user::toggleDebugging')
      }
    }
    window.onkeyup = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        messenger.publish('user::ctrlkeyup')
      }
    }
  }, [])

  const handleMoveStart =
    (_e: React.MouseEvent | React.TouchEvent, info: UnifiedEventInfo) => {
      setIsMoving(true)
      messenger.publish('user::dragstart', info)
    }

  const handleMoving =
    (_e: React.MouseEvent | React.TouchEvent, info: UnifiedEventInfo) => {
      if (isMoving) {
        messenger.publish('user::dragging', info)
      }
      messenger.publish('user::mousemove', info)
    }

  const handleMoveEnd =
    (_e: React.MouseEvent | React.TouchEvent, info: UnifiedEventInfo) => {
      setIsMoving(false)
      messenger.publish('user::dragend', info)
    }

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const unifiedInfo = {
      clientX: e.clientX,
      clientY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    }
    if (e.type === 'mousedown')
      handleMoveStart(e, unifiedInfo)
    else if (e.type === 'mousemove')
      handleMoving(e, unifiedInfo)
    else
      handleMoveEnd(e, unifiedInfo)
  }

  const handleTouch = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const unifiedInfo = {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
      originX: rect.left,
      originY: rect.top,
      offsetX: e.touches[0].clientX - rect.left,
      offsetY: e.touches[0].clientY - rect.top
    }
    if (e.type === 'touchstart')
      handleMoveStart(e, unifiedInfo)
    else if (e.type === 'touchmove')
      handleMoving(e, unifiedInfo)
    else
      handleMoveEnd(e, unifiedInfo)
  }

  return (
    <>
      <style jsx>{`
        div {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }
      `}</style>
      <div
        onMouseDown={handleMouse}
        onTouchStart={handleTouch}
        onMouseMove={handleMouse}
        onTouchMove={handleTouch}
        onMouseUp={handleMouse}
        // onMouseLeave={handleMouse} prevent block being put at unreachable position
        onTouchEnd={handleTouch}
        onTouchCancel={handleTouch}>
        {props.children}
      </div>
    </>
  )
}