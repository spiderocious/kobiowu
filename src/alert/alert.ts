import type { Component, AlertOptions, AlertType } from '../types'
import { renderComponent } from '../renderer'
import { trapFocus, lockScroll } from '../lifecycle'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertMount {
  wrapper: HTMLElement
  content: HTMLElement
  destroy: () => void
}

// ─── mountAlert ───────────────────────────────────────────────────────────────

/**
 * Mounts an alert overlay into `parent`.
 *
 * - Blocking: backdrop click does NOT close by default.
 * - Focus is trapped inside. Scroll is locked.
 * - Calls `onConfirm` / `onCancel` on user action when provided.
 * - Zero-style: no colours or layout applied — consumers bring their own.
 */
export function mountAlert(
  component: Component,
  parent: HTMLElement,
  options: AlertOptions = {},
): AlertMount {
  const alertType: AlertType = options.type ?? 'confirm'

  // ── Wrapper ──────────────────────────────────────────────────────────────────
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'alert')
  wrapper.setAttribute('data-kb-alert-type', alertType)
  wrapper.setAttribute('role', 'alertdialog')
  wrapper.setAttribute('aria-modal', 'true')
  wrapper.setAttribute('tabindex', '-1')
  wrapper.style.cssText = [
    'position: fixed',
    'inset: 0',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'pointer-events: auto',
    'box-sizing: border-box',
  ].join('; ')

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  // ── Content box ───────────────────────────────────────────────────────────────
  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'alert')
  content.style.cssText = 'position: relative; pointer-events: auto; box-sizing: border-box'

  if (options.width !== undefined) content.style.width = typeof options.width === 'number' ? `${options.width}px` : options.width
  if (options.height !== undefined) content.style.height = typeof options.height === 'number' ? `${options.height}px` : options.height
  if (options.maxWidth !== undefined) content.style.maxWidth = typeof options.maxWidth === 'number' ? `${options.maxWidth}px` : options.maxWidth

  // ── Confirm / Cancel buttons ──────────────────────────────────────────────────
  // Exposed as a data-driven API: consumers can render their own buttons inside
  // `component` and call ref.close(); OR they rely on the built-in button bar.
  // Here we wire delegate listener so that clicks on [data-kb-confirm] /
  // [data-kb-cancel] fire the callbacks without requiring the component to know
  // about them.

  const handleClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement
    if (target.closest('[data-kb-confirm]')) {
      const value = (target.closest('[data-kb-confirm]') as HTMLInputElement | null)?.value
      options.onConfirm?.(value)
    } else if (target.closest('[data-kb-cancel]')) {
      options.onCancel?.()
    }
  }

  // ── Mount component ───────────────────────────────────────────────────────────
  const teardownComponent = renderComponent(component, content)
  content.addEventListener('click', handleClick)

  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  // trapFocus is required for alert (WCAG)
  const cleanupFocus = trapFocus(wrapper)
  const unlockScroll = lockScroll()

  // ── Teardown ──────────────────────────────────────────────────────────────────
  const destroy = (): void => {
    cleanupFocus()
    unlockScroll()
    content.removeEventListener('click', handleClick)
    teardownComponent()
    wrapper.remove()
  }

  return { wrapper, content, destroy }
}
