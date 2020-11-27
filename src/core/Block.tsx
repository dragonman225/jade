import * as React from 'react'
import * as typestyle from 'typestyle'
import { IPubSub } from '../lib/pubsub'
import { IconDragHandle } from './component/IconDragHandle'
import { IconCross } from './component/IconCross'
import { IconExpand } from './component/IconExpand'
import {
  UnifiedEventInfo, ContentProps, Vec2, InitializedContent
} from '../interfaces'
import { isPointInRect } from '../lib/utils'

type ChildrenProps = Pick<ContentProps<InitializedContent>,
'readOnly' | 'onInteractionStart' | 'onInteractionEnd'>

interface Props {
  readOnly: boolean
  data: {
    blockId: string
    position: Vec2
    width: number
  }
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
  dragPosition: { x: number; y: number }
  lastDragPosition: { x: number; y: number }
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
      dragPosition: { x: 0, y: 0 },
      lastDragPosition: { x: 0, y: 0 }
    }

    /** For inResizeArea() to getBoundingClientRect(). */
    this.ref = React.createRef<HTMLDivElement>()
  }

  inDragArea(x: number, y: number): boolean {
    const mousePoint = { x, y }
    const dragRect = {
      top: this.props.data.position.y,
      left: this.props.data.position.x,
      bottom: this.props.data.position.y + dragHandleSize,
      right: this.props.data.position.x + dragHandleSize
    }
    if (isPointInRect(mousePoint, dragRect)) return true
    else return false
  }

  inResizeArea(msg: UnifiedEventInfo): boolean {
    const { offsetX, offsetY, originX, originY } = msg
    const mousePoint = {
      x: offsetX,
      y: offsetY
    }
    const blockRect = this.ref.current.getBoundingClientRect()
    const resizeRect = {
      top: blockRect.bottom - dragHandleSize - originY,
      left: blockRect.right - dragHandleSize - originX,
      bottom: blockRect.bottom,
      right: blockRect.right
    }
    if (isPointInRect(mousePoint, resizeRect)) return true
    else return false
  }

  handleDragStart = (msg: UnifiedEventInfo): void => {
    if (this.inDragArea(msg.offsetX, msg.offsetY) && this.state.mouseIsInside) {
      this.setState({ moving: true })
      if (typeof this.props.onInteractionStart === 'function')
        this.props.onInteractionStart()
    }
    if (this.inResizeArea(msg) && this.state.mouseIsInside) {
      this.setState({ resizing: true })
      if (typeof this.props.onInteractionStart === 'function')
        this.props.onInteractionStart()
    }
    this.state.dragPosition.x = msg.offsetX - this.props.data.position.x
    this.state.dragPosition.y = msg.offsetY - this.props.data.position.y
    this.state.lastDragPosition.x = msg.offsetX
    this.state.lastDragPosition.y = msg.offsetY
  }

  handleDragging = (msg: UnifiedEventInfo): void => {
    if (this.state.moving) {
      const newPos = {
        x: msg.offsetX - this.state.dragPosition.x,
        y: msg.offsetY - this.state.dragPosition.y
      }
      const limit = {
        minX: dragHandleSize,
        maxX: window.innerWidth - dragHandleSize,
        minY: dragHandleSize,
        maxY: window.innerHeight - dragHandleSize
      }
      const width = this.props.data.width
      const minHeight = 55

      if (newPos.x < limit.minX) newPos.x = limit.minX
      else if (newPos.x + width > limit.maxX) newPos.x = limit.maxX - width
      if (newPos.y < limit.minY) newPos.y = limit.minY
      else if (newPos.y + minHeight > limit.maxY) newPos.y = limit.maxY - minHeight

      this.props.onMove(newPos)
      this.props.messenger.publish('block::moving')
    }

    if (this.state.resizing) {
      const deltaX = msg.offsetX - this.state.lastDragPosition.x
      const newW = this.props.data.width + deltaX
      const minW = dragHandleSize * 2

      if (newW > minW) {
        this.props.onResize(newW)
        this.setState({
          lastDragPosition: {
            x: msg.offsetX,
            y: msg.offsetY
          }
        })
      } else {
        this.props.onResize(minW)
      }

      this.props.messenger.publish('block::resizing')
    }
  }

  handleDragEnd = (): void => {
    if (this.state.moving || this.state.resizing) {
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
    const containerStyle: React.CSSProperties = {
      transform: `translate(${this.props.data.position.x}px, ${this.props.data.position.y}px)`,
      width: `${this.props.data.width}px`,
      zIndex: this.isActive() ? 1 : 'unset'
    }
    const styles = {
      Block: typestyle.style({
        position: 'absolute',
        top: 0,
        left: 0,
        color: 'rgb(65, 65, 65)',
        display: 'flex',
        alignItems: 'center',
        wordBreak: 'break-word',
        userSelect: 'none'
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
            background: 'rgba(182, 182, 182, 0.8)',
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
        style={this.props.container ? containerStyle : {
          ...containerStyle,
          background: this.isActive() ? 'rgba(235, 235, 235, 0.8)' : 'inherit'
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
          maxHeight: window.innerHeight - this.props.data.position.y - 24
        }}>
          {
            this.props.children
              ? this.props.children({
                readOnly: this.props.readOnly,
                onInteractionStart: this.handleContentInteractionStart,
                onInteractionEnd: this.handleContentInteractionEnd
              })
              : <></>}
        </div>
      </Container>
    )
  }
}