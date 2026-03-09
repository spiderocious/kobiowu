import type { Component, ModalOptions } from '../types'
import { renderComponent } from '../renderer'
import { applySize, applyPosition } from '../positioning'
import { trapFocus, lockScroll } from '../lifecycle'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalMount {
  /** The fixed-position wrapper that covers the viewport */
  wrapper: HTMLElement
  /** The inner content box */
  content: HTMLElement
  /** Tear everything down */
  destroy: () => void
}

// ─── Modal renderer ───────────────────────────────────────────────────────────

/**
 * Mounts a modal into `parent`.
 *
 * - Zero-style: no colours, borders, or shadows applied.
 * - `centered` (default true) vertically and horizontally centres the content.
 * - `scrollable` allows the content box to scroll independently.
 * - Traps focus and locks scroll automatically (WCAG).
 */
export function mountModal(
  component: Component,
  parent: HTMLElement,
  options: ModalOptions = {},
): ModalMount {
  const centered = options.centered ?? true
  const scrollable = options.scrollable ?? false

  // ── Wrapper ─────────────────────────────────────────────────────────────────
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'modal')
  wrapper.setAttribute('role', 'dialog')
  wrapper.setAttribute('aria-modal', 'true')
  wrapper.setAttribute('tabindex', '-1')
  wrapper.style.cssText = [
    'position: fixed',
    'inset: 0',
    'display: flex',
    'pointer-events: auto',
    centered ? 'align-items: center' : 'align-items: flex-start',
    centered ? 'justify-content: center' : 'justify-content: flex-start',
    'box-sizing: border-box',
  ].join('; ')

  // ── Content box ─────────────────────────────────────────────────────────────
  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'modal')
  content.style.cssText = [
    'position: relative',
    'box-sizing: border-box',
    'pointer-events: auto',
    scrollable ? 'overflow-y: auto' : '',
  ]
    .filter(Boolean)
    .join('; ')

  // Apply sizing
  applySize(content, {
    ...(options.fullscreen !== undefined ? { fullscreen: options.fullscreen } : {}),
    ...(options.width !== undefined ? { width: options.width } : {}),
    ...(options.height !== undefined ? { height: options.height } : {}),
    ...(options.maxWidth !== undefined ? { maxWidth: options.maxWidth } : {}),
    ...(options.maxHeight !== undefined ? { maxHeight: options.maxHeight } : {}),
  })

  // Apply explicit position override (non-centered)
  if (!centered && options.position) {
    applyPosition(content, options.position, options.offset)
  }

  // Apply user className / style
  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  // ── Mount component ─────────────────────────────────────────────────────────
  const teardownComponent = renderComponent(component, content)
  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  const cleanupFocus = trapFocus(wrapper)
  const unlockScroll = lockScroll()

  // ── Teardown ─────────────────────────────────────────────────────────────────
  const destroy = (): void => {
    cleanupFocus()
    unlockScroll()
    teardownComponent()
    wrapper.remove()
  }

  return { wrapper, content, destroy }
}
