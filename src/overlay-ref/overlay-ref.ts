import type {
  OverlayRef,
  OverlayType,
  OverlayState,
  OverlayOptions,
  OverlayEvent,
  Component,
  ToastType,
  XY,
} from '../types'
import { EventEmitter } from '../event-emitter'

export interface BaseOverlayRefInit {
  id: string
  type: OverlayType
  group?: string
  element: HTMLElement
  contentElement: HTMLElement
  options: OverlayOptions
  onPatch: (options: Partial<OverlayOptions>) => void
  onClose: (reason?: string) => Promise<void>
  onOpen: () => Promise<void>
  onUpdate: (component: Component) => void
  onMoveTo: (x: number, y: number) => void
  onResetPosition: () => void
  onGetPosition: () => XY
  onSetPriority: (priority: number) => void
  onBringToFront: () => void
  onSendToBack: () => void
}

export class BaseOverlayRef implements OverlayRef {
  readonly id: string
  readonly type: OverlayType

  private _state: OverlayState = 'opening'
  private _data: Record<string, unknown>
  private _toastType: ToastType | undefined
  private _progress = 0
  private readonly _emitter = new EventEmitter()
  private readonly _init: BaseOverlayRefInit

  /** Exposed for registry group filtering */
  readonly _group: string | undefined

  constructor(init: BaseOverlayRefInit) {
    this._init = init
    this.id = init.id
    this.type = init.type
    this._group = init.group
    this._data = { ...(init.options.data ?? {}) }
  }

  // ─── State ──────────────────────────────────────────────────────────────────

  get state(): OverlayState {
    return this._state
  }

  _setState(state: OverlayState): void {
    this._state = state
    if (state === 'open') this._emitter.emit('open', this)
    if (state === 'closed') this._emitter.emit('close', this)
  }

  // ─── Control ────────────────────────────────────────────────────────────────

  async close(reason?: string): Promise<void> {
    if (this._state === 'closing' || this._state === 'closed') return

    // onBeforeClose guard
    const guard = this._init.options.onBeforeClose
    if (guard) {
      const allow = await guard(this)
      if (!allow) return
    }

    this._setState('closing')
    await this._init.onClose(reason)
    this._setState('closed')
    this._emitter.emit('close', this, reason)
  }

  async open(): Promise<void> {
    if (this._state === 'open' || this._state === 'opening') return
    this._setState('opening')
    await this._init.onOpen()
    this._setState('open')
    this._emitter.emit('open', this)
  }

  async toggle(): Promise<void> {
    if (this._state === 'open' || this._state === 'opening') {
      await this.close()
    } else {
      await this.open()
    }
  }

  focus(): void {
    this._init.element.focus()
    this._emitter.emit('focus', this)
  }

  // ─── Live patch ─────────────────────────────────────────────────────────────

  patch(options: Partial<OverlayOptions>): void {
    Object.assign(this._init.options, options)
    this._init.onPatch(options)
  }

  // ─── Position ───────────────────────────────────────────────────────────────

  moveTo(x: number, y: number): void {
    this._init.onMoveTo(x, y)
  }

  resetPosition(): void {
    this._init.onResetPosition()
  }

  getPosition(): XY {
    return this._init.onGetPosition()
  }

  // ─── Content ────────────────────────────────────────────────────────────────

  update(component: Component): void {
    this._init.onUpdate(component)
  }

  getData(): Record<string, unknown> {
    return { ...this._data }
  }

  setData(data: Record<string, unknown>): void {
    this._data = { ...data }
  }

  // ─── Toast specific ─────────────────────────────────────────────────────────

  setType(type: ToastType): void {
    this._toastType = type
    this.patch({ data: { ...this._data, __toastType: type } })
  }

  setProgress(value: number): void {
    this._progress = Math.min(100, Math.max(0, value))
    this.patch({ data: { ...this._data, __progress: this._progress } })
  }

  // ─── Stack control ──────────────────────────────────────────────────────────

  sendToBack(): void {
    this._init.onSendToBack()
  }

  bringToFront(): void {
    this._init.onBringToFront()
  }

  setPriority(priority: number): void {
    this._init.onSetPriority(priority)
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  on(event: OverlayEvent, handler: (...args: unknown[]) => void): () => void {
    return this._emitter.on(event, handler)
  }

  once(event: OverlayEvent, handler: (...args: unknown[]) => void): void {
    this._emitter.once(event, handler)
  }

  off(event: OverlayEvent, handler: (...args: unknown[]) => void): void {
    this._emitter.off(event, handler)
  }

  _emit(event: OverlayEvent, ...args: unknown[]): void {
    this._emitter.emit(event, ...args)
  }

  // ─── DOM access ─────────────────────────────────────────────────────────────

  get element(): HTMLElement | null {
    return this._init.element
  }

  get contentElement(): HTMLElement | null {
    return this._init.contentElement
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  get _toastTypeValue(): ToastType | undefined {
    return this._toastType
  }

  get _progressValue(): number {
    return this._progress
  }

  destroy(): void {
    this._emitter.removeAllListeners()
  }
}
