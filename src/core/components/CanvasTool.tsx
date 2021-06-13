import * as React from 'react'
import { classes, stylesheet } from 'typestyle'
import { Eraser } from './icons/Eraser'
import { Pencil } from './icons/Pencil'
import { IPubSub } from '../utils'
import { UnifiedEventInfo, Stroke, StrokeConfig, Point } from '../interfaces'

interface CanvasProps {
  value: Stroke[] /** Value representing a drawing. */
  readOnly?: boolean /** Whether to allow drawing. */
  /** Notify drawing changes (on a new stroke). */
  onChange?: (strokes: Stroke[]) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  messenger: IPubSub
  scheduleCanvasInsertion(cb: (containerEl: HTMLElement) => void): void
  mouseIsInsideBlock: boolean
}

interface CanvasState {
  drawState: 'can_edit' | 'can_draw' | 'drawing'
  strokeConfig: 'pencil' | 'eraser'
}

const pencil: StrokeConfig = {
  lineWidth: 3,
  shadowBlur: 1,
  shadowColor: 'rgb(0, 0, 0)',
  strokeStyle: 'black',
  compositeOperation: 'source-over',
}

const eraser: StrokeConfig = {
  lineWidth: 24,
  shadowBlur: 0,
  shadowColor: 'rgb(0, 0, 0)',
  strokeStyle: 'white',
  compositeOperation: 'destination-out',
}

function resizeCanvas(el: HTMLCanvasElement, width: number, height: number) {
  el.width = width
  el.height = height
  el.style.width = `${width}px`
  el.style.height = `${height}px`
}

function clearCanvas(el: HTMLCanvasElement) {
  el.getContext('2d').clearRect(0, 0, el.width, el.height)
}

function calcMidPoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, path: Stroke) {
  const points = path.points

  if (points.length < 2) return

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = path.config.lineWidth
  ctx.strokeStyle = path.config.strokeStyle
  ctx.shadowBlur = path.config.shadowBlur
  ctx.shadowColor = path.config.shadowColor
  ctx.globalCompositeOperation = path.config.compositeOperation
  ctx.lineJoin = ctx.lineCap = 'round'
  ctx.moveTo(points[0].x, points[0].y)

  /** Draw to the middle of the first two points. */
  const midPoint = calcMidPoint(points[0], points[1])
  ctx.lineTo(midPoint.x, midPoint.y)

  for (let i = 2; i < points.length; i++) {
    const lastPoint = points[i - 1]
    const currentPoint = points[i]
    const midPoint = calcMidPoint(lastPoint, currentPoint)

    /** To midPoint, using lastPoint as the control point. */
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y)
  }

  /** Draw to the last point. */
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  strokes.forEach(stroke => {
    drawStroke(ctx, stroke)
  })
}

function drawEraser(ctx: CanvasRenderingContext2D, position: Point) {
  ctx.beginPath()
  ctx.arc(position.x, position.y, eraser.lineWidth / 2, 0, 2 * Math.PI)
  ctx.stroke()
}

const styles = stylesheet({
  InkItemContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  InkItem: {
    width: 40,
    height: 40,
    $nest: {
      '&>button': {
        width: '100%',
        height: '100%',
        background: 'none',
        border: 'none',
        borderRadius: 8,
        outline: 'none',
        fill: '#c5c5c5',
        transition: 'fill 0.1s, background 0.1s',
      },
      '&>button:hover': {
        background: 'var(--bg-hover)',
      },
    },
  },
  'InkItem--Active': {
    $nest: {
      '&>button': {
        fill: '#000',
      },
    },
  },
})

export class CanvasTool extends React.Component<CanvasProps, CanvasState> {
  refTmp: React.RefObject<HTMLCanvasElement>
  refCommited: React.RefObject<HTMLCanvasElement>
  refCursor: React.RefObject<HTMLCanvasElement>
  ctxTmp: CanvasRenderingContext2D
  ctxCommited: CanvasRenderingContext2D
  ctxCursor: CanvasRenderingContext2D
  strokes: Stroke[]
  hotStroke: Stroke

  constructor(props: CanvasProps) {
    super(props)
    this.refTmp = React.createRef<HTMLCanvasElement>()
    this.refCommited = React.createRef<HTMLCanvasElement>()
    this.refCursor = React.createRef<HTMLCanvasElement>()
    this.ctxTmp = undefined
    this.ctxCommited = undefined
    this.ctxCursor = undefined
    this.strokes = props.value
    this.hotStroke = { config: pencil, points: [] }

    this.state = {
      drawState: 'can_edit',
      strokeConfig: 'pencil',
    }
  }

  addHotPoint(x: number, y: number): void {
    this.hotStroke.points.push({ x, y })
  }

  commitStroke(): void {
    this.strokes.push(this.hotStroke)
    this.hotStroke = {
      config: this.state.strokeConfig === 'pencil' ? pencil : eraser,
      points: [],
    }
  }

  resizeAllCanvases = (): void => {
    resizeCanvas(this.refCursor.current, window.innerWidth, window.innerHeight)
    resizeCanvas(this.refTmp.current, window.innerWidth, window.innerHeight)
    resizeCanvas(
      this.refCommited.current,
      window.innerWidth,
      window.innerHeight
    )
  }

  onResizeWindow = (): void => {
    /**
     * A canvas is cleared by the browser when its size changed,
     * so a re-draw is needed.
     * TODO: Throttle re-draw.
     */
    console.log('canvas: resize')
    this.resizeAllCanvases()
    drawStrokes(this.ctxCommited, this.strokes)
  }

  onCtrlKeyDown = (msg: UnifiedEventInfo): void => {
    if (!this.props.readOnly && this.state.drawState === 'can_edit') {
      console.log('canvas: state: can_draw')
      this.setState({ drawState: 'can_draw' })
      this.props.onInteractionStart()
    }
    if (this.state.strokeConfig === 'eraser') {
      drawEraser(this.ctxCursor, { x: msg.clientX, y: msg.clientY })
    }
  }

  onCtrlKeyUp = (): void => {
    if (this.state.drawState === 'drawing') {
      clearCanvas(this.refTmp.current)
      drawStroke(this.ctxCommited, this.hotStroke)
      this.commitStroke()
    }
    clearCanvas(this.refCursor.current)
    console.log('canvas: state: can_edit')
    this.setState({ drawState: 'can_edit' })
    this.props.onInteractionEnd()
  }

  onDragStart = (msg: UnifiedEventInfo): void => {
    if (this.state.drawState === 'can_draw' && !this.props.mouseIsInsideBlock) {
      console.log('canvas: state: drawing')
      this.setState({ drawState: 'drawing' })
      this.addHotPoint(msg.offsetX, msg.offsetY)
    }
  }

  onDragging = (msg: UnifiedEventInfo): void => {
    if (this.state.drawState === 'drawing') {
      this.props.messenger.publish('canvas::drawing')
      this.addHotPoint(msg.offsetX, msg.offsetY)
      if (this.state.strokeConfig === 'pencil') {
        clearCanvas(this.refTmp.current)
        drawStroke(this.ctxTmp, this.hotStroke)
      } else {
        /**
         * HACK: Since the eraser uses 'destination-out', it must be drawn
         * on the ctxCommited to take effect.
         */
        drawStroke(this.ctxCommited, this.hotStroke)
      }
    }
  }

  onDragEnd = (msg: UnifiedEventInfo): void => {
    if (this.state.drawState === 'drawing') {
      console.log('canvas: state: can_draw')
      this.setState({ drawState: 'can_draw' })
      this.addHotPoint(msg.offsetX, msg.offsetY)
      clearCanvas(this.refTmp.current)
      drawStroke(this.ctxCommited, this.hotStroke)
      this.commitStroke()
      if (this.props.onChange) this.props.onChange(this.strokes)
    }
  }

  onMouseMove = (msg: UnifiedEventInfo): void => {
    clearCanvas(this.refCursor.current)
    if (
      (this.state.drawState === 'can_draw' ||
        this.state.drawState === 'drawing') &&
      this.state.strokeConfig === 'eraser'
    )
      drawEraser(this.ctxCursor, {
        x: msg.offsetX,
        y: msg.offsetY,
      })
  }

  componentDidMount(): void {
    this.refTmp = { current: document.createElement('canvas') }
    this.refCommited = { current: document.createElement('canvas') }
    this.refCursor = { current: document.createElement('canvas') }

    const canvasStyle =
      '\
      position: absolute;\
      top: 0;\
      left: 0;\
      z-index: 10000;\
      pointer-events: none;'

    this.refTmp.current.setAttribute('style', canvasStyle)
    this.refCommited.current.setAttribute('style', canvasStyle)
    this.refCursor.current.setAttribute('style', canvasStyle)

    this.props.scheduleCanvasInsertion(containerEl => {
      containerEl.append(this.refTmp.current)
      containerEl.append(this.refCommited.current)
      containerEl.append(this.refCursor.current)
    })

    this.ctxTmp = this.refTmp.current.getContext('2d')
    this.ctxCommited = this.refCommited.current.getContext('2d')
    this.ctxCursor = this.refCursor.current.getContext('2d')
    console.log('canvas: mount')
    this.resizeAllCanvases()
    drawStrokes(this.ctxCommited, this.strokes)

    this.props.messenger.subscribe('user::resizewindow', this.onResizeWindow)
    this.props.messenger.subscribe('user::ctrlkeydown', this.onCtrlKeyDown)
    this.props.messenger.subscribe('user::ctrlkeyup', this.onCtrlKeyUp)
    this.props.messenger.subscribe('user::dragstart', this.onDragStart)
    this.props.messenger.subscribe('user::dragging', this.onDragging)
    this.props.messenger.subscribe('user::dragend', this.onDragEnd)
    this.props.messenger.subscribe('user::mousemove', this.onMouseMove)
  }

  componentWillUnmount(): void {
    this.refTmp.current.remove()
    this.refCommited.current.remove()
    this.refCursor.current.remove()

    this.props.messenger.unsubscribe('user::resizewindow', this.onResizeWindow)
    this.props.messenger.unsubscribe('user::ctrlkeydown', this.onCtrlKeyDown)
    this.props.messenger.unsubscribe('user::ctrlkeyup', this.onCtrlKeyUp)
    this.props.messenger.unsubscribe('user::dragstart', this.onDragStart)
    this.props.messenger.unsubscribe('user::dragging', this.onDragging)
    this.props.messenger.unsubscribe('user::dragend', this.onDragEnd)
    this.props.messenger.unsubscribe('user::mousemove', this.onMouseMove)
  }

  toggleStroke = (): void => {
    if (this.state.strokeConfig === 'pencil') {
      this.setState({ strokeConfig: 'eraser' })
      this.hotStroke.config = eraser
    } else {
      this.setState({ strokeConfig: 'pencil' })
      this.hotStroke.config = pencil
    }
  }

  render(): JSX.Element {
    console.log('canvas: render')
    const cursor =
      this.state.drawState === 'can_draw' || this.state.drawState === 'drawing'
        ? this.state.strokeConfig === 'eraser'
          ? 'none'
          : 'crosshair'
        : 'auto'
    return (
      <>
        {this.state.drawState === 'can_draw' ||
        this.state.drawState === 'drawing' ? (
          <div
            className={styles.InkItemContainer}
            /** HACK: Prevent drawing under toolbar. */
            onMouseDown={e => {
              e.stopPropagation()
            }}>
            <style jsx>{`
              :global(body) {
                cursor: ${cursor};
              }
            `}</style>
            <div
              className={classes(
                styles.InkItem,
                this.state.strokeConfig === 'pencil'
                  ? styles['InkItem--Active']
                  : undefined
              )}>
              <button onClick={this.toggleStroke}>
                <Pencil />
              </button>
            </div>
            <div
              className={classes(
                styles.InkItem,
                this.state.strokeConfig === 'eraser'
                  ? styles['InkItem--Active']
                  : undefined
              )}>
              <button onClick={this.toggleStroke}>
                <Eraser />
              </button>
            </div>
          </div>
        ) : (
          <></>
        )}
      </>
    )
  }
}
