import type { Component, ToastOptions, ToastPosition, ToastType } from '../types'
import { renderComponent } from '../renderer'
import { AutoCloseTimer } from '../lifecycle'

// ─── Region management ────────────────────────────────────────────────────────
// One ARIA live region per page, shared across all toasts.

let _liveRegion: HTMLElement | null = null

function getLiveRegion(ariaLive: 'polite' | 'assertive' = 'polite'): HTMLElement {
  if (_liveRegion) return _liveRegion
  _liveRegion = document.createElement('div')
  _liveRegion.setAttribute('aria-live', ariaLive)
  _liveRegion.setAttribute('aria-atomic', 'true')
  _liveRegion.style.cssText = [
    'position: absolute',
    'width: 1px',
    'height: 1px',
    'overflow: hidden',
    'clip: rect(0,0,0,0)',
    'white-space: nowrap',
  ].join('; ')
  document.body.appendChild(_liveRegion)
  return _liveRegion
}

/** For tests — reset the singleton. */
export function _resetLiveRegion(): void {
  _liveRegion?.remove()
  _liveRegion = null
}

// ─── Position container registry ─────────────────────────────────────────────
// One container per position, lazily created and appended to document.body.

const _positionContainers = new Map<ToastPosition, HTMLElement>()

function getPositionContainer(position: ToastPosition, gap: number): HTMLElement {
  const existing = _positionContainers.get(position)
  if (existing) return existing

  const container = document.createElement('div')
  container.setAttribute('data-kb-toast-region', position)
  container.style.cssText = buildRegionStyle(position, gap)
  document.body.appendChild(container)
  _positionContainers.set(position, container)
  return container
}

export function _resetPositionContainers(): void {
  for (const c of _positionContainers.values()) c.remove()
  _positionContainers.clear()
}

function buildRegionStyle(position: ToastPosition, gap: number): string {
  const base = [
    'position: fixed',
    'display: flex',
    'flex-direction: column',
    `gap: ${gap}px`,
    'pointer-events: none',
    'z-index: 1100',
    'box-sizing: border-box',
    'padding: 16px',
  ]

  switch (position) {
    case 'top-right':    return [...base, 'top: 0', 'right: 0', 'align-items: flex-end'].join('; ')
    case 'top-left':     return [...base, 'top: 0', 'left: 0', 'align-items: flex-start'].join('; ')
    case 'top-center':   return [...base, 'top: 0', 'left: 50%', 'transform: translateX(-50%)', 'align-items: center'].join('; ')
    case 'bottom-right': return [...base, 'bottom: 0', 'right: 0', 'align-items: flex-end', 'flex-direction: column-reverse'].join('; ')
    case 'bottom-left':  return [...base, 'bottom: 0', 'left: 0', 'align-items: flex-start', 'flex-direction: column-reverse'].join('; ')
    case 'bottom-center':return [...base, 'bottom: 0', 'left: 50%', 'transform: translateX(-50%)', 'align-items: center', 'flex-direction: column-reverse'].join('; ')
  }
}

// ─── Swipe handling ───────────────────────────────────────────────────────────

function attachSwipeToDismiss(
  el: HTMLElement,
  axis: boolean | 'x' | 'y',
  onDismiss: () => void,
): () => void {
  let startX = 0
  let startY = 0
  const THRESHOLD = 60

  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0]
    if (!t) return
    startX = t.clientX
    startY = t.clientY
  }

  const onTouchEnd = (e: TouchEvent): void => {
    const t = e.changedTouches[0]
    if (!t) return
    const dx = Math.abs(t.clientX - startX)
    const dy = Math.abs(t.clientY - startY)
    if (axis === 'y' && dy > THRESHOLD) onDismiss()
    else if (axis === 'x' && dx > THRESHOLD) onDismiss()
    else if (axis === true && (dx > THRESHOLD || dy > THRESHOLD)) onDismiss()
  }

  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchend', onTouchEnd)
  return () => {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchend', onTouchEnd)
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function createProgressBar(duration: number): { el: HTMLElement; start: () => void } {
  const el = document.createElement('div')
  el.setAttribute('data-kb-toast-progress', '')
  el.style.cssText = [
    'position: absolute',
    'bottom: 0',
    'left: 0',
    'height: 3px',
    'width: 100%',
    'background: currentColor',
    'opacity: 0.3',
    'transform-origin: left',
  ].join('; ')

  return {
    el,
    start: () => {
      el.style.transition = `transform ${duration}ms linear`
      // Defer so transition takes effect
      requestAnimationFrame(() => {
        el.style.transform = 'scaleX(0)'
      })
    },
  }
}

// ─── Toast mount ──────────────────────────────────────────────────────────────

export interface ToastMount {
  wrapper: HTMLElement
  content: HTMLElement
  timer: AutoCloseTimer | null
  setType: (type: ToastType) => void
  destroy: () => void
}

export function mountToast(
  component: Component,
  options: ToastOptions = {},
  onClose: () => void,
  ariaLive?: 'polite' | 'assertive',
): ToastMount {
  const position: ToastPosition = (options.position as ToastPosition | undefined) ?? 'top-right'
  const duration = options.duration ?? 4000
  const gap = options.gap ?? 8
  const pauseOnHover = options.pauseOnHover ?? true
  const showProgress = options.showProgress ?? false

  // ── Position container ───────────────────────────────────────────────────────
  const regionContainer = getPositionContainer(position, gap)

  // Enforce limit
  if (options.limit !== undefined) {
    const existing = regionContainer.querySelectorAll('[data-kb-overlay="toast"]')
    if (existing.length >= options.limit) {
      // Remove oldest
      existing[0]?.remove()
    }
  }

  // ── Wrapper ──────────────────────────────────────────────────────────────────
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'toast')
  wrapper.setAttribute('data-kb-toast-type', options.type ?? 'default')
  wrapper.setAttribute('role', 'status')
  wrapper.setAttribute('aria-live', ariaLive ?? 'polite')
  wrapper.style.cssText = [
    'position: relative',
    'pointer-events: auto',
    'box-sizing: border-box',
  ].join('; ')

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  // ── Content ──────────────────────────────────────────────────────────────────
  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'toast')
  wrapper.appendChild(content)

  // ── Progress bar ──────────────────────────────────────────────────────────────
  let progress: ReturnType<typeof createProgressBar> | null = null
  if (showProgress && duration > 0) {
    progress = createProgressBar(duration)
    wrapper.appendChild(progress.el)
  }

  // ── Mount component ───────────────────────────────────────────────────────────
  const teardownComponent = renderComponent(component, content)

  // ── ARIA announcement ─────────────────────────────────────────────────────────
  const liveRegion = getLiveRegion(ariaLive)
  liveRegion.textContent = content.textContent ?? ''

  // ── Append to region ──────────────────────────────────────────────────────────
  regionContainer.appendChild(wrapper)
  progress?.start()

  // ── Swipe-to-dismiss ──────────────────────────────────────────────────────────
  let cleanupSwipe: (() => void) | null = null
  if (options.swipeToDismiss) {
    cleanupSwipe = attachSwipeToDismiss(wrapper, options.swipeToDismiss, onClose)
  }

  // ── Auto-close timer ──────────────────────────────────────────────────────────
  let timer: AutoCloseTimer | null = null
  if (duration > 0) {
    timer = new AutoCloseTimer({
      duration,
      onClose,
      pauseOnHover,
      ...(pauseOnHover ? { element: wrapper } : {}),
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const setType = (type: ToastType): void => {
    wrapper.setAttribute('data-kb-toast-type', type)
  }

  const destroy = (): void => {
    timer?.destroy()
    cleanupSwipe?.()
    teardownComponent()
    wrapper.remove()

    // Remove position container if empty
    if (regionContainer.children.length === 0) {
      regionContainer.remove()
      _positionContainers.delete(position)
    }
  }

  return { wrapper, content, timer, setType, destroy }
}
