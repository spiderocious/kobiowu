import type { ResizeHandle } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResizeOptions {
  handles?: ResizeHandle[]
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

// ─── Handle cursors ───────────────────────────────────────────────────────────

const CURSOR_MAP: Record<ResizeHandle, string> = {
  n: 'n-resize',
  s: 's-resize',
  e: 'e-resize',
  w: 'w-resize',
  ne: 'ne-resize',
  nw: 'nw-resize',
  se: 'se-resize',
  sw: 'sw-resize',
}

const DEFAULT_HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const HANDLE_SIZE = 8 // px

// ─── ResizeController ─────────────────────────────────────────────────────────

export class ResizeController {
  private _element: HTMLElement
  private _options: Required<ResizeOptions>
  private _handleEls: Map<ResizeHandle, HTMLElement> = new Map()
  private _destroyed = false

  // Active drag state
  private _activeHandle: ResizeHandle | null = null
  private _startRect: Rect = { left: 0, top: 0, width: 0, height: 0 }
  private _startMouse = { x: 0, y: 0 }

  // Bound handlers
  private readonly _onMouseMove: (e: MouseEvent) => void
  private readonly _onMouseUp: () => void

  constructor(element: HTMLElement, options: ResizeOptions = {}) {
    this._element = element
    this._options = {
      handles: options.handles ?? DEFAULT_HANDLES,
      minWidth: options.minWidth ?? 80,
      minHeight: options.minHeight ?? 60,
      maxWidth: options.maxWidth ?? Infinity,
      maxHeight: options.maxHeight ?? Infinity,
    }

    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onMouseUp = this._handleMouseUp.bind(this)

    // Ensure element has non-static position so left/top take effect
    const pos = getComputedStyle(element).position
    if (pos === 'static') element.style.position = 'relative'

    this._createHandles()
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    for (const el of this._handleEls.values()) el.remove()
    this._handleEls.clear()
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
  }

  // ─── Handle creation ────────────────────────────────────────────────────────

  private _createHandles(): void {
    for (const side of this._options.handles) {
      const el = document.createElement('div')
      el.setAttribute('data-kb-resize-handle', side)
      el.style.cssText = this._handleStyle(side)
      el.addEventListener('mousedown', (e) => this._startResize(e, side))
      this._element.appendChild(el)
      this._handleEls.set(side, el)
    }
  }

  private _handleStyle(side: ResizeHandle): string {
    const half = HANDLE_SIZE / 2
    const base = [
      'position: absolute',
      `width: ${HANDLE_SIZE}px`,
      `height: ${HANDLE_SIZE}px`,
      `cursor: ${CURSOR_MAP[side]}`,
      'z-index: 1',
      'user-select: none',
    ]

    switch (side) {
      case 'n':  return [...base, `top: ${-half}px`, 'left: 50%', 'transform: translateX(-50%)', 'width: calc(100% - 16px)', `height: ${HANDLE_SIZE}px`].join('; ')
      case 's':  return [...base, `bottom: ${-half}px`, 'left: 50%', 'transform: translateX(-50%)', 'width: calc(100% - 16px)', `height: ${HANDLE_SIZE}px`].join('; ')
      case 'e':  return [...base, 'top: 50%', `right: ${-half}px`, 'transform: translateY(-50%)', `width: ${HANDLE_SIZE}px`, 'height: calc(100% - 16px)'].join('; ')
      case 'w':  return [...base, 'top: 50%', `left: ${-half}px`, 'transform: translateY(-50%)', `width: ${HANDLE_SIZE}px`, 'height: calc(100% - 16px)'].join('; ')
      case 'ne': return [...base, `top: ${-half}px`, `right: ${-half}px`].join('; ')
      case 'nw': return [...base, `top: ${-half}px`, `left: ${-half}px`].join('; ')
      case 'se': return [...base, `bottom: ${-half}px`, `right: ${-half}px`].join('; ')
      case 'sw': return [...base, `bottom: ${-half}px`, `left: ${-half}px`].join('; ')
    }
  }

  // ─── Resize logic ───────────────────────────────────────────────────────────

  private _startResize(e: MouseEvent, side: ResizeHandle): void {
    e.preventDefault()
    e.stopPropagation()

    this._activeHandle = side
    this._startMouse = { x: e.clientX, y: e.clientY }

    const rect = this._element.getBoundingClientRect()
    this._startRect = {
      left: this._element.offsetLeft,
      top: this._element.offsetTop,
      width: rect.width,
      height: rect.height,
    }

    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseup', this._onMouseUp)
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this._activeHandle) return

    const dx = e.clientX - this._startMouse.x
    const dy = e.clientY - this._startMouse.y
    const { left, top, width, height } = this._startRect
    const { minWidth, minHeight, maxWidth, maxHeight } = this._options

    let newLeft = left
    let newTop = top
    let newWidth = width
    let newHeight = height

    const side = this._activeHandle

    // Horizontal
    if (side.includes('e')) newWidth = Math.min(maxWidth, Math.max(minWidth, width + dx))
    if (side.includes('w')) {
      const clamped = Math.min(maxWidth, Math.max(minWidth, width - dx))
      newLeft = left + (width - clamped)
      newWidth = clamped
    }

    // Vertical
    if (side.includes('s')) newHeight = Math.min(maxHeight, Math.max(minHeight, height + dy))
    if (side.includes('n')) {
      const clamped = Math.min(maxHeight, Math.max(minHeight, height - dy))
      newTop = top + (height - clamped)
      newHeight = clamped
    }

    this._element.style.width = `${newWidth}px`
    this._element.style.height = `${newHeight}px`
    this._element.style.left = `${newLeft}px`
    this._element.style.top = `${newTop}px`
  }

  private _handleMouseUp(): void {
    this._activeHandle = null
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
  }
}
