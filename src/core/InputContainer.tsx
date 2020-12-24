import * as React from 'react'
import { stylesheet } from 'typestyle'
import { useState, useEffect } from 'react'
import { IPubSub } from './lib/pubsub'
import { UnifiedEventInfo } from './interfaces'

export interface InputContainerProps {
  messenger: IPubSub
}

const DragState = {
  Idle: Symbol('idle'),
  Ready: Symbol('ready'),
  Dragging: Symbol('dragging')
}

type Event = 'pointerdown' | 'pointermove' | 'pointerup'

const styles = stylesheet({
  InputContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

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
  const [dragState, setDragState] = useState(DragState.Idle)

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

  /**
   * Lagacy: Currently users expect user::mousemove to fire whenever 
   * pointer moves.
   * In the future, proper pen events should be implemented.
   */
  const pointerMove = (info: UnifiedEventInfo) => {
    messenger.publish('user::mousemove', info)
  }

  const handleEvent = (type: Event, info: UnifiedEventInfo) => {
    switch (dragState) {
      case DragState.Idle: {
        if (type === 'pointerdown') {
          setDragState(DragState.Ready)
        }
        break
      }
      case DragState.Ready: {
        if (type === 'pointermove') {
          messenger.publish('user::dragstart', info)
          setDragState(DragState.Dragging)
        } else if (type === 'pointerup') {
          messenger.publish('user::tap', info)
          setDragState(DragState.Idle)
        }
        break
      }
      case DragState.Dragging: {
        if (type === 'pointermove') {
          messenger.publish('user::dragging', info)
        } else if (type === 'pointerup') {
          messenger.publish('user::dragend', info)
          setDragState(DragState.Idle)
        }
        break
      }
    }
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
      handleEvent('pointerdown', unifiedInfo)
    else if (e.type === 'mousemove') {
      handleEvent('pointermove', unifiedInfo)
      pointerMove(unifiedInfo)
    } else
      handleEvent('pointerup', unifiedInfo)
  }

  const handleTouch = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const unifiedInfo = e.touches.length ?
      {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        originX: rect.left,
        originY: rect.top,
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      } :
      {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
        originX: rect.left,
        originY: rect.top,
        offsetX: e.changedTouches[0].clientX - rect.left,
        offsetY: e.changedTouches[0].clientY - rect.top
      }
    if (e.type === 'touchstart')
      handleEvent('pointerdown', unifiedInfo)
    else if (e.type === 'touchmove') {
      handleEvent('pointermove', unifiedInfo)
      pointerMove(unifiedInfo)
    } else
      handleEvent('pointerup', unifiedInfo)
  }

  return (
    <div
      className={styles.InputContainer}
      onMouseDown={handleMouse}
      onMouseMove={handleMouse}
      onMouseUp={handleMouse}
      // onMouseLeave={handleMouse} prevent block being put at unreachable position
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouch}
      onTouchCancel={handleTouch}>
      {props.children}
    </div>
  )
}