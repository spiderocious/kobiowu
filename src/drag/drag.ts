import type { DragAxis, DragBounds, XY, OverlayRef } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DragOptions {
  axis?: DragAxis
  bounds?: DragBounds
  handle?: string | HTMLElement
  initialPosition?: XY
  onDragStart?: (ref: OverlayRef, pos: XY) => void
  onDragEnd?: (ref: OverlayRef, pos: XY) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveHandle(element: HTMLElement, handle: string | HTMLElement | undefined): HTMLElement {
  if (!handle) return element
  if (handle instanceof HTMLElement) return handle
  return element.querySelector<HTMLElement>(handle) ?? element
}

function clampToBounds(x: number, y: number, bounds: DragBounds, el: HTMLElement): XY {
  if (bounds === 'viewport') {
    const rect = el.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width
    const maxY = window.innerHeight - rect.height
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) }
  }

  if (bounds === 'parent') {
    const parent = el.offsetParent as HTMLElement | null
    if (!parent) return { x, y }
    const rect = el.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()
    const maxX = parentRect.width - rect.width
    const maxY = parentRect.height - rect.height
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) }
  }

  // DOMRect
  const rect = el.getBoundingClientRect()
  const maxX = bounds.width - rect.width
  const maxY = bounds.height - rect.height
  return {
    x: Math.max(bounds.x, Math.min(x, bounds.x + maxX)),
    y: Math.max(bounds.y, Math.min(y, bounds.y + maxY)),
  }
}

// ─── DragController ───────────────────────────────────────────────────────────

export class DragController {
  private _element: HTMLElement
  private _handle: HTMLElement
  private _options: DragOptions
  private _ref: OverlayRef
  private _pos: XY = { x: 0, y: 0 }
  private _startPos: XY = { x: 0, y: 0 }
  private _startMouse: XY = { x: 0, y: 0 }
  private _dragging = false
  private _destroyed = false

  // Bound handlers stored for cleanup
  private readonly _onMouseDown: (e: MouseEvent) => void
  private readonly _onMouseMove: (e: MouseEvent) => void
  private readonly _onMouseUp: (e: MouseEvent) => void
  private readonly _onTouchStart: (e: TouchEvent) => void
  private readonly _onTouchMove: (e: TouchEvent) => void
  private readonly _onTouchEnd: (e: TouchEvent) => void

  constructor(element: HTMLElement, ref: OverlayRef, options: DragOptions) {
    this._element = element
    this._options = options
    this._ref = ref
    this._handle = resolveHandle(element, options.handle)

    // Bind handlers
    this._onMouseDown = this._handleMouseDown.bind(this)
    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onMouseUp = this._handleMouseUp.bind(this)
    this._onTouchStart = this._handleTouchStart.bind(this)
    this._onTouchMove = this._handleTouchMove.bind(this)
    this._onTouchEnd = this._handleTouchEnd.bind(this)

    // Apply initial position
    if (options.initialPosition) {
      this._applyPosition(options.initialPosition.x, options.initialPosition.y)
    }

    this._attach()
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  getPosition(): XY {
    return { ...this._pos }
  }

  moveTo(x: number, y: number): void {
    this._applyPosition(x, y)
  }

  reset(): void {
    this._applyPosition(0, 0)
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._detach()
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _attach(): void {
    this._handle.style.cursor = 'grab'
    this._handle.addEventListener('mousedown', this._onMouseDown)
    this._handle.addEventListener('touchstart', this._onTouchStart, { passive: false })
  }

  private _detach(): void {
    this._handle.removeEventListener('mousedown', this._onMouseDown)
    this._handle.removeEventListener('touchstart', this._onTouchStart)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
    document.removeEventListener('touchmove', this._onTouchMove)
    document.removeEventListener('touchend', this._onTouchEnd)
    this._handle.style.removeProperty('cursor')
  }

  private _handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()
    this._beginDrag(e.clientX, e.clientY)
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseup', this._onMouseUp)
  }

  private _handleMouseMove(e: MouseEvent): void {
    this._moveDrag(e.clientX, e.clientY)
  }

  private _handleMouseUp(e: MouseEvent): void {
    this._endDrag(e.clientX, e.clientY)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
  }

  private _handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    this._beginDrag(touch.clientX, touch.clientY)
    document.addEventListener('touchmove', this._onTouchMove, { passive: false })
    document.addEventListener('touchend', this._onTouchEnd)
  }

  private _handleTouchMove(e: TouchEvent): void {
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    this._moveDrag(touch.clientX, touch.clientY)
  }

  private _handleTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0]
    if (!touch) return
    this._endDrag(touch.clientX, touch.clientY)
    document.removeEventListener('touchmove', this._onTouchMove)
    document.removeEventListener('touchend', this._onTouchEnd)
  }

  private _beginDrag(clientX: number, clientY: number): void {
    this._dragging = true
    this._startMouse = { x: clientX, y: clientY }
    this._startPos = { ...this._pos }
    this._handle.style.cursor = 'grabbing'
    this._options.onDragStart?.(this._ref, { ...this._pos })
  }

  private _moveDrag(clientX: number, clientY: number): void {
    if (!this._dragging) return

    const dx = clientX - this._startMouse.x
    const dy = clientY - this._startMouse.y

    const axis = this._options.axis ?? 'both'
    let x = this._startPos.x + (axis !== 'y' ? dx : 0)
    let y = this._startPos.y + (axis !== 'x' ? dy : 0)

    if (this._options.bounds) {
      const clamped = clampToBounds(x, y, this._options.bounds, this._element)
      x = clamped.x
      y = clamped.y
    }

    this._applyPosition(x, y)
  }

  private _endDrag(clientX: number, clientY: number): void {
    if (!this._dragging) return
    this._dragging = false
    this._handle.style.cursor = 'grab'

    // Final position update
    this._moveDrag(clientX, clientY)
    this._options.onDragEnd?.(this._ref, { ...this._pos })
  }

  private _applyPosition(x: number, y: number): void {
    this._pos = { x, y }
    this._element.style.transform = `translate(${x}px, ${y}px)`
  }
}
