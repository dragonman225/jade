import * as React from 'react'
import * as typestyle from 'typestyle'
import { IPubSub } from '../lib/pubsub'
import { IconDragHandle } from './component/IconDragHandle'
import { IconCross } from './component/IconCross'
import { IconExpand } from './component/IconExpand'
import {
  UnifiedEventInfo, ContentProps, Vec2, InitializedConceptData, Origin
} from '../interfaces'
import { isPointInRect } from '../lib/utils'

type ChildrenProps = Pick<ContentProps<InitializedConceptData>,
'readOnly' | 'onInteractionStart' | 'onInteractionEnd'> & {
  width: number
}

interface Props {
  readOnly: boolean
  data: {
    blockId: string
    position: Vec2
    width: number
  }
  origin: Origin
  zIndex: number
  container?: React.ComponentClass<any> | React.FunctionComponent<any>
  onResize: (width: number) => void
  onMove: (position: Vec2) => void
  onRemove?: () => void
  onExpand?: () => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  messenger: IPubSub
  children?: (props: ChildrenProps) => JSX.Element
}

interface State {
  moving: boolean
  editing: boolean
  resizing: boolean
  mouseIsInside: boolean
  width: number
  position: Vec2
  moveDelta: Vec2
  dragOffset: Vec2
  lastMovePosition: Vec2
  blockRectOnDragStart?: DOMRect
}

const dragHandleSize = 22

export class Block extends React.Component<Props, State> {
  ref: React.RefObject<HTMLDivElement>
  _isMounted: boolean // for the tricky remove

  constructor(props: Props) {
    super(props)
    this.state = {
      moving: false,
      editing: false,
      resizing: false,
      mouseIsInside: false,
      width: props.data.width,
      position: props.data.position,
      moveDelta: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      lastMovePosition: { x: 0, y: 0 }
    }

    /** For inResizeArea() to getBoundingClientRect(). */
    this.ref = React.createRef<HTMLDivElement>()
  }

  inDragArea(point: Vec2, blockRect: DOMRect): boolean {
    const mousePoint = point
    const dragRect = {
      top: blockRect.top,
      left: blockRect.left,
      bottom: blockRect.top + dragHandleSize,
      right: blockRect.left + dragHandleSize
    }
    if (isPointInRect(mousePoint, dragRect)) return true
    else return false
  }

  inResizeArea(point: Vec2, blockRect: DOMRect): boolean {
    const mousePoint = point
    const resizeRect = {
      top: blockRect.bottom - dragHandleSize,
      left: blockRect.right - dragHandleSize,
      bottom: blockRect.bottom,
      right: blockRect.right
    }
    if (isPointInRect(mousePoint, resizeRect)) return true
    else return false
  }

  handleDragStart = (msg: UnifiedEventInfo): void => {
    const blockRect = this.ref.current.getBoundingClientRect()
    const mousePoint = { x: msg.clientX, y: msg.clientY }
    if (this.inDragArea(mousePoint, blockRect) && this.state.mouseIsInside) {
      this.setState({ moving: true })
      if (typeof this.props.onInteractionStart === 'function')
        this.props.onInteractionStart()
    }
    if (this.inResizeArea(mousePoint, blockRect) && this.state.mouseIsInside) {
      this.setState({ resizing: true })
      if (typeof this.props.onInteractionStart === 'function')
        this.props.onInteractionStart()
    }
    this.setState({
      blockRectOnDragStart: blockRect,
      dragOffset: {
        x: msg.offsetX - this.state.position.x,
        y: msg.offsetY - this.state.position.y
      },
      lastMovePosition: {
        x: msg.offsetX,
        y: msg.offsetY
      }
    })
  }

  handleDragging = (msg: UnifiedEventInfo): void => {
    if (this.state.moving) {
      const moveDelta = {
        x: msg.offsetX - this.state.lastMovePosition.x,
        y: msg.offsetY - this.state.lastMovePosition.y
      }
      const newPos = {
        x: this.state.position.x + moveDelta.x,
        y: this.state.position.y + moveDelta.y
      }

      const blockWidth = this.state.width
      //const blockHeight = this.state.blockRectOnDragStart.height
      const blockHeight = 52 /** min height */

      const originType = this.props.origin.type
      const posLimit = {
        left: (originType === 'TL' || originType === 'BL') ? dragHandleSize : -window.innerWidth + dragHandleSize + blockWidth,
        right: (originType === 'TL' || originType === 'BL') ? window.innerWidth - dragHandleSize - blockWidth : -dragHandleSize,
        top: (originType === 'TL' || originType === 'TR') ? dragHandleSize : -window.innerHeight + dragHandleSize + blockHeight,
        bottom: (originType === 'TL' || originType === 'TR') ? window.innerHeight - dragHandleSize - blockHeight : -dragHandleSize
      }

      /** Limit newPos in allowed range. */
      if (newPos.x < posLimit.left) newPos.x = posLimit.left
      else if (newPos.x > posLimit.right) newPos.x = posLimit.right
      if (newPos.y < posLimit.top) newPos.y = posLimit.top
      else if (newPos.y > posLimit.bottom) newPos.y = posLimit.bottom

      this.setState({
        position: newPos,
        lastMovePosition: {
          x: newPos.x + this.state.dragOffset.x,
          y: newPos.y + this.state.dragOffset.y
        }
      })
      this.props.messenger.publish('block::moving')
    }

    if (this.state.resizing) {
      const deltaX = msg.offsetX - this.state.lastMovePosition.x
      const newW = this.state.width + deltaX
      const minW = dragHandleSize * 2

      if (newW > minW) {
        this.setState({
          width: newW,
          lastMovePosition: {
            x: msg.offsetX,
            y: msg.offsetY
          }
        })
      } else {
        this.setState({ width: minW })
      }

      this.props.messenger.publish('block::resizing')
    }
  }

  handleDragEnd = (): void => {
    if (this.state.moving || this.state.resizing) {
      if (this.state.moving) this.props.onMove(this.state.position)
      else if (this.state.resizing) this.props.onResize(this.state.width)
      this.setState({ moving: false, resizing: false })
      if (typeof this.props.onInteractionEnd === 'function')
        this.props.onInteractionEnd()
    }
  }

  componentDidMount(): void {
    this._isMounted = true
    this.props.messenger.subscribe('user::dragstart', this.handleDragStart)
    this.props.messenger.subscribe('user::dragging', this.handleDragging)
    this.props.messenger.subscribe('user::dragend', this.handleDragEnd)
  }

  componentWillUnmount(): void {
    this._isMounted = false
    this.props.messenger.unsubscribe('user::dragstart', this.handleDragStart)
    this.props.messenger.unsubscribe('user::dragging', this.handleDragging)
    this.props.messenger.unsubscribe('user::dragend', this.handleDragEnd)
  }

  componentWillReceiveProps(props: Props): void {
    this.setState({
      position: props.data.position
    })
  }

  handleMouseEnter = (): void => {
    if (!this.props.readOnly) {
      this.setState({ mouseIsInside: true })
    }
  }

  handleMouseLeave = (): void => {
    /**
     * HACK: Not checking readOnly here, considering this case:
     * mouseEnter -> ctrlDown (activate canvas, lock blocks) -> 
     * mouseLeave -> ctrlUp (deactivate canvas, unlock blocks)
     * The desire behavior is the background being reseted, so we need to 
     * detect that "mouseLeave" even when locked.
     */
    this.setState({ mouseIsInside: false })
  }

  handleContentInteractionStart = (): void => {
    this.setState({ editing: true })
    if (typeof this.props.onInteractionStart === 'function')
      this.props.onInteractionStart()
  }

  handleContentInteractionEnd = (): void => {
    this.setState({ editing: false })
    if (typeof this.props.onInteractionEnd === 'function')
      this.props.onInteractionEnd()
  }

  isActive = (): boolean => {
    return !this.props.readOnly &&
      (this.state.mouseIsInside || this.state.resizing ||
        this.state.moving || this.state.editing)
  }

  render(): JSX.Element {
    const Container = this.props.container || 'div'
    const { type, ...origin } = this.props.origin
    const commonStyle: React.CSSProperties = {
      ...origin,
      transform: `translate(${this.state.position.x}px, ${this.state.position.y}px)`,
      transformOrigin: function () {
        switch (type) {
          case 'TL':
            return 'top left'
          case 'TR':
            return 'top right'
          case 'BL':
            return 'bottom left'
          default:
            return 'bottom right'
        }
      }(),
      width: `${this.state.width}px`,
      zIndex: this.isActive() ? 9999 : this.props.zIndex
    }
    const styles = {
      Block: typestyle.style({
        position: 'absolute',
        borderRadius: '.3rem',
        color: 'rgb(65, 65, 65)',
        display: 'flex',
        alignItems: 'center',
        wordBreak: 'break-word',
        userSelect: 'none',
        overflow: 'hidden' // To enforce borderRadius.
      }),
      Handle: typestyle.style({
        position: 'absolute',
        width: dragHandleSize,
        height: dragHandleSize,
        fill: '#aaa',
        padding: '.3rem',
        background: 'rgba(0, 0, 0, 0)',
        $nest: {
          '&:hover, &:active': {
            background: 'rgba(182, 182, 182, 0.7)',
            fill: '#7c7c7c'
          }
        }
      }),
      HandleHide: typestyle.style({
        display: 'none'
      }),
      DragArea: typestyle.style({
        top: 0,
        left: 0,
        cursor: 'grab'
      }),
      DragAreaMoving: typestyle.style({
        cursor: 'grabbing'
      }),
      ExpandArea: typestyle.style({
        top: 0,
        right: 0,
        cursor: 'default'
      }),
      ResizeArea: typestyle.style({
        bottom: 0,
        right: 0,
        cursor: 'ew-resize'
      }),
      RemoveArea: typestyle.style({
        bottom: 0,
        left: 0,
        cursor: 'default'
      }),
      ContentArea: typestyle.style({
        width: '100%',
        minHeight: 2 * dragHandleSize,
        overflow: 'auto'
      }),
      DebugId: typestyle.style({
        display: 'none',
        fontSize: 6,
        position: 'absolute',
        top: 0,
        left: 0,
        color: '#050c9c',
        whiteSpace: 'nowrap'
      })
    }
    return (
      <Container
        className={styles.Block} ref={this.ref}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleMouseEnter}
        style={this.props.container ? commonStyle : {
          ...commonStyle,
          background: this.isActive() ? '#eeeeee' : 'inherit'
        }}>
        <span className={styles.DebugId}>{this.props.data.blockId}</span>
        <div className={typestyle.classes(
          styles.Handle,
          (this.props.readOnly || !this.state.mouseIsInside) && styles.HandleHide,
          styles.DragArea,
          this.state.moving && styles.DragAreaMoving)}>
          <IconDragHandle />
        </div>
        {
          typeof this.props.onExpand === 'function' ?
            <div className={typestyle.classes(
              styles.Handle,
              (this.props.readOnly || !this.state.mouseIsInside) && styles.HandleHide,
              styles.ExpandArea)}
            onClick={this.props.onExpand}>
              <IconExpand />
            </div> : <></>
        }
        <div className={typestyle.classes(
          styles.Handle,
          (this.props.readOnly || !this.state.mouseIsInside) && styles.HandleHide,
          styles.ResizeArea)}>
          <IconDragHandle />
        </div>
        {
          typeof this.props.onRemove === 'function' ?
            <div className={typestyle.classes(
              styles.Handle,
              (this.props.readOnly || !this.state.mouseIsInside) && styles.HandleHide,
              styles.RemoveArea)}
            onClick={this.props.onRemove}>
              <IconCross />
            </div> : <></>
        }
        <div className={styles.ContentArea} style={{
          maxHeight: window.innerHeight - this.state.position.y - 24
        }}>
          {
            this.props.children
              ? this.props.children({
                readOnly: this.props.readOnly,
                onInteractionStart: this.handleContentInteractionStart,
                onInteractionEnd: this.handleContentInteractionEnd,
                width: this.state.width
              })
              : <></>}
        </div>
      </Container>
    )
  }
}