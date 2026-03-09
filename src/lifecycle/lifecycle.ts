// ─── Escape key handler ───────────────────────────────────────────────────────

type CloseCallback = () => void

/**
 * Registers a global `keydown` listener that calls `onClose` when Escape is
 * pressed. Returns a cleanup function.
 */
export function watchEscape(onClose: CloseCallback): () => void {
  const handler = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}

// ─── Focus trap ───────────────────────────────────────────────────────────────

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ')

/**
 * Traps focus within `container`. Returns a cleanup function.
 *
 * - Focuses the first focusable child on activation.
 * - Cycles Tab/Shift+Tab within the container.
 */
export function trapFocus(container: HTMLElement): () => void {
  const getFocusable = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[inert]'),
    )

  // Focus first focusable element
  const first = getFocusable()[0]
  if (first) {
    // Defer one tick to ensure the element is visible
    Promise.resolve().then(() => first.focus())
  }

  const handler = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const firstEl = focusable[0]!
    const lastEl = focusable[focusable.length - 1]!

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
  }

  container.addEventListener('keydown', handler)
  return () => container.removeEventListener('keydown', handler)
}

// ─── Scroll lock ──────────────────────────────────────────────────────────────

let _lockCount = 0
let _savedScrollbarWidth = 0

/** For tests — reset the scroll lock counter and DOM state. */
export function _resetScrollLock(): void {
  _lockCount = 0
  document.body.style.removeProperty('overflow')
  document.body.style.removeProperty('padding-right')
}

/**
 * Prevents body scroll. Reference-counted so multiple overlays can lock
 * simultaneously without double-unlocking.
 * Returns a cleanup function.
 */
export function lockScroll(): () => void {
  if (_lockCount === 0) {
    // Measure scrollbar width to avoid layout shift
    _savedScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (_savedScrollbarWidth > 0) {
      document.body.style.paddingRight = `${_savedScrollbarWidth}px`
    }
  }
  _lockCount++

  return () => {
    _lockCount = Math.max(0, _lockCount - 1)
    if (_lockCount === 0) {
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
    }
  }
}

// ─── Auto-close timer ─────────────────────────────────────────────────────────

export interface AutoCloseOptions {
  duration: number        // ms; 0 = no auto-close
  onClose: CloseCallback
  pauseOnHover?: boolean
  element?: HTMLElement   // element to attach hover listeners to
}

export class AutoCloseTimer {
  private _timer: ReturnType<typeof setTimeout> | null = null
  private _remaining: number
  private _startedAt = 0
  private _paused = false
  private _destroyed = false
  private readonly _opts: AutoCloseOptions

  // Hover handlers (stored for cleanup)
  private readonly _onEnter: () => void
  private readonly _onLeave: () => void

  constructor(opts: AutoCloseOptions) {
    this._opts = opts
    this._remaining = opts.duration

    this._onEnter = () => this.pause()
    this._onLeave = () => this.resume()

    if (opts.pauseOnHover && opts.element) {
      opts.element.addEventListener('mouseenter', this._onEnter)
      opts.element.addEventListener('mouseleave', this._onLeave)
    }

    this._start()
  }

  pause(): void {
    if (this._paused || this._destroyed) return
    this._paused = true
    if (this._timer !== null) {
      clearTimeout(this._timer)
      this._timer = null
      this._remaining -= Date.now() - this._startedAt
    }
  }

  resume(): void {
    if (!this._paused || this._destroyed) return
    this._paused = false
    this._start()
  }

  reset(): void {
    this._remaining = this._opts.duration
    if (!this._paused) {
      if (this._timer !== null) clearTimeout(this._timer)
      this._start()
    }
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    if (this._timer !== null) clearTimeout(this._timer)
    if (this._opts.pauseOnHover && this._opts.element) {
      this._opts.element.removeEventListener('mouseenter', this._onEnter)
      this._opts.element.removeEventListener('mouseleave', this._onLeave)
    }
  }

  get isPaused(): boolean {
    return this._paused
  }

  private _start(): void {
    if (this._remaining <= 0) return
    this._startedAt = Date.now()
    this._timer = setTimeout(() => {
      if (!this._destroyed) this._opts.onClose()
    }, this._remaining)
  }
}
