import type {
  Component,
  OverlayRef,
  OverlayOptions,
  OverlayFilter,
  ModalOptions,
  ToastOptions,
  DrawerOptions,
  AlertOptions,
  KobiowuConfig,
  OverlayType,
} from '../types'
import { OverlayRegistry, generateId } from '../registry'
import { BaseOverlayRef } from '../overlay-ref'
import { mountModal } from '../modal'
import { mountToast } from '../toast'
import { mountDrawer } from '../drawer'
import { mountAlert } from '../alert'
import { mountSheet, type SheetOptions } from '../extras'
import { renderComponent } from '../renderer'
import { watchEscape } from '../lifecycle'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlobalEvent = 'launch' | 'close' | 'focus'

type Handler = (...args: unknown[]) => void

interface TimerControls {
  pause: () => void
  resume: () => void
}

// ─── API class ────────────────────────────────────────────────────────────────

class KobiowuAPI {
  private readonly _registry = new OverlayRegistry()
  private readonly _listeners = new Map<GlobalEvent, Set<Handler>>()
  private _config: KobiowuConfig = {}
  private readonly _timers = new Map<string, TimerControls>()

  // ─── Configuration ──────────────────────────────────────────────────────────

  config(options: KobiowuConfig): void {
    this._config = { ...this._config, ...options }
  }

  // ─── Global events ──────────────────────────────────────────────────────────

  on(event: GlobalEvent, handler: Handler): () => void {
    let set = this._listeners.get(event)
    if (!set) {
      set = new Set()
      this._listeners.set(event, set)
    }
    set.add(handler)
    return () => { this._listeners.get(event)?.delete(handler) }
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────

  launchModal(component: Component, options: ModalOptions = {}): OverlayRef {
    const id = options.id ?? generateId('modal')
    const merged: ModalOptions = { ...this._config.defaults?.modal, ...options, id }

    if (merged.singleton) {
      const existing = this._registry.get(id)
      if (existing) void existing.close('singleton')
    }

    const parent = this._resolveTarget()
    const { wrapper, content, destroy: mountDestroy } = mountModal(component, parent, merged)

    let escapeCleanup: (() => void) | null = null

    const ref = this._makeRef({
      id,
      type: 'modal',
      merged,
      element: wrapper,
      contentElement: content,
      onClose: async () => {
        escapeCleanup?.()
        mountDestroy()
        this._registry.unregister(id)
        this._emit('close', ref)
      },
      onUpdate: (comp) => {
        content.innerHTML = ''
        renderComponent(comp, content)
      },
    })

    if (merged.closeOnEscape !== false) {
      escapeCleanup = watchEscape(() => { void ref.close('escape') })
    }

    return this._register(ref)
  }

  // ─── Toast ──────────────────────────────────────────────────────────────────

  launchToast(component: Component, options: ToastOptions = {}): OverlayRef {
    const id = options.id ?? generateId('toast')
    const merged: ToastOptions = { ...this._config.defaults?.toast, ...options, id }
    const ariaLive = this._config.ariaLive

    // ref is assigned after mountToast; auto-close callback fires asynchronously
    // (via setTimeout) so ref is always defined by the time it's called.
    let ref!: BaseOverlayRef

    const { wrapper, content, timer, destroy: mountDestroy } = mountToast(
      component,
      merged,
      () => { void ref.close('auto') },
      ariaLive,
    )

    if (timer) {
      this._timers.set(id, { pause: () => timer.pause(), resume: () => timer.resume() })
    }

    ref = this._makeRef({
      id,
      type: 'toast',
      merged,
      element: wrapper,
      contentElement: content,
      onClose: async () => {
        timer?.destroy()
        mountDestroy()
        this._timers.delete(id)
        this._registry.unregister(id)
        this._emit('close', ref)
      },
      onUpdate: (comp) => {
        content.innerHTML = ''
        renderComponent(comp, content)
      },
    })

    return this._register(ref)
  }

  // ─── Drawer ─────────────────────────────────────────────────────────────────

  launchDrawer(component: Component, options: DrawerOptions = {}): OverlayRef {
    const id = options.id ?? generateId('drawer')
    const merged: DrawerOptions = { ...this._config.defaults?.drawer, ...options, id }

    const parent = this._resolveTarget()
    const { wrapper, content, destroy: mountDestroy } = mountDrawer(component, parent, merged)

    let escapeCleanup: (() => void) | null = null

    const ref = this._makeRef({
      id,
      type: 'drawer',
      merged,
      element: wrapper,
      contentElement: content,
      onClose: async () => {
        escapeCleanup?.()
        mountDestroy()
        this._registry.unregister(id)
        this._emit('close', ref)
      },
      onUpdate: (comp) => {
        content.innerHTML = ''
        renderComponent(comp, content)
      },
    })

    if (merged.closeOnEscape !== false) {
      escapeCleanup = watchEscape(() => { void ref.close('escape') })
    }

    return this._register(ref)
  }

  // ─── Alert ──────────────────────────────────────────────────────────────────

  launchAlert(component: Component, options: AlertOptions = {}): OverlayRef {
    const id = options.id ?? generateId('alert')
    const merged: AlertOptions = { ...this._config.defaults?.alert, ...options, id }

    const parent = this._resolveTarget()
    const { wrapper, content, destroy: mountDestroy } = mountAlert(component, parent, merged)

    const ref = this._makeRef({
      id,
      type: 'alert',
      merged,
      element: wrapper,
      contentElement: content,
      onClose: async () => {
        mountDestroy()
        this._registry.unregister(id)
        this._emit('close', ref)
      },
      onUpdate: (comp) => {
        content.innerHTML = ''
        renderComponent(comp, content)
      },
    })

    return this._register(ref)
  }

  // ─── Sheet ──────────────────────────────────────────────────────────────────

  launchSheet(component: Component, options: SheetOptions = {}): OverlayRef {
    const id = options.id ?? generateId('sheet')
    const merged: SheetOptions = { ...options, id }

    const parent = this._resolveTarget()
    const { wrapper, content, destroy: mountDestroy } = mountSheet(component, parent, merged)

    let escapeCleanup: (() => void) | null = null

    const ref = this._makeRef({
      id,
      type: 'sheet',
      merged,
      element: wrapper,
      contentElement: content,
      onClose: async () => {
        escapeCleanup?.()
        mountDestroy()
        this._registry.unregister(id)
        this._emit('close', ref)
      },
      onUpdate: (comp) => {
        content.innerHTML = ''
        renderComponent(comp, content)
      },
    })

    if (merged.closeOnEscape !== false) {
      escapeCleanup = watchEscape(() => { void ref.close('escape') })
    }

    return this._register(ref)
  }

  // ─── Generic escape hatch ───────────────────────────────────────────────────

  launch(type: OverlayType, component: Component, options: OverlayOptions = {}): OverlayRef {
    switch (type) {
      case 'modal':  return this.launchModal(component, options as ModalOptions)
      case 'toast':  return this.launchToast(component, options as ToastOptions)
      case 'drawer': return this.launchDrawer(component, options as DrawerOptions)
      case 'alert':  return this.launchAlert(component, options as AlertOptions)
      case 'sheet':  return this.launchSheet(component, options as SheetOptions)
      default:       return this.launchModal(component, options as ModalOptions)
    }
  }

  // ─── Batch operations ───────────────────────────────────────────────────────

  async closeAll(filter?: OverlayFilter): Promise<void> {
    await Promise.all(this._registry.getAll(filter).map((r) => r.close()))
  }

  pauseAll(filter?: OverlayFilter): void {
    for (const ref of this._registry.getAll(filter)) {
      this._timers.get(ref.id)?.pause()
    }
  }

  resumeAll(filter?: OverlayFilter): void {
    for (const ref of this._registry.getAll(filter)) {
      this._timers.get(ref.id)?.resume()
    }
  }

  patchAll(options: Partial<OverlayOptions>, filter?: OverlayFilter): void {
    for (const ref of this._registry.getAll(filter)) {
      ref.patch(options)
    }
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private _emit(event: GlobalEvent, ...args: unknown[]): void {
    const set = this._listeners.get(event)
    if (!set) return
    for (const handler of set) {
      handler(...args)
    }
  }

  private _resolveTarget(): HTMLElement {
    const target = this._config.portalTarget
    if (!target) return document.body
    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target)
      if (!el) throw new Error(`kobiowu: portalTarget "${target}" not found`)
      return el
    }
    return target
  }

  private _makeRef(opts: {
    id: string
    type: OverlayType
    merged: OverlayOptions
    element: HTMLElement
    contentElement: HTMLElement
    onClose: (reason?: string) => Promise<void>
    onUpdate: (component: Component) => void
  }): BaseOverlayRef {
    return new BaseOverlayRef({
      id: opts.id,
      type: opts.type,
      ...(opts.merged.group !== undefined ? { group: opts.merged.group } : {}),
      element: opts.element,
      contentElement: opts.contentElement,
      options: opts.merged,
      onPatch: () => {},
      onClose: opts.onClose,
      onOpen: async () => {},
      onUpdate: opts.onUpdate,
      onMoveTo: () => {},
      onResetPosition: () => {},
      onGetPosition: () => ({ x: 0, y: 0 }),
      onSetPriority: () => {},
      onBringToFront: () => {},
      onSendToBack: () => {},
    })
  }

  private _register(ref: BaseOverlayRef): OverlayRef {
    ref._setState('open')
    this._registry.register(ref)
    this._emit('launch', ref)
    return ref
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { KobiowuAPI }
export const kobiowu = new KobiowuAPI()
export type { SheetOptions }
