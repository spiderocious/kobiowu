import type { Component, DrawerOptions } from '../types'
import { renderComponent } from '../renderer'
import { lockScroll } from '../lifecycle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Side = 'left' | 'right' | 'top' | 'bottom'

export interface DrawerMount {
  wrapper: HTMLElement
  content: HTMLElement
  snapTo: (point: string | number) => void
  destroy: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sizeAxis(side: Side): 'width' | 'height' {
  return side === 'left' || side === 'right' ? 'width' : 'height'
}

function toCss(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

function buildWrapperStyle(side: Side): string {
  const base = [
    'position: fixed',
    'inset: 0',
    'display: flex',
    'pointer-events: none',
    'box-sizing: border-box',
  ]
  switch (side) {
    case 'left':   return [...base, 'justify-content: flex-start', 'align-items: stretch'].join('; ')
    case 'right':  return [...base, 'justify-content: flex-end', 'align-items: stretch'].join('; ')
    case 'top':    return [...base, 'flex-direction: column', 'justify-content: flex-start'].join('; ')
    case 'bottom': return [...base, 'flex-direction: column', 'justify-content: flex-end'].join('; ')
  }
}

function buildContentStyle(side: Side, size: string | number | undefined): string {
  const axis = sizeAxis(side)
  const sizeVal = size !== undefined ? toCss(size) : axis === 'width' ? '320px' : '50vh'
  return [
    'position: relative',
    'pointer-events: auto',
    'box-sizing: border-box',
    'overflow-y: auto',
    `${axis}: ${sizeVal}`,
    // Full cross-axis
    axis === 'width' ? 'height: 100%' : 'width: 100%',
  ].join('; ')
}

// ─── Snap points ──────────────────────────────────────────────────────────────

function normaliseSnapPoint(point: string | number): string {
  return typeof point === 'number' ? `${point}px` : point
}

function applySnapPoint(
  contentEl: HTMLElement,
  side: Side,
  point: string | number,
): void {
  const axis = sizeAxis(side)
  contentEl.style[axis] = normaliseSnapPoint(point)
}

// ─── pushContent ──────────────────────────────────────────────────────────────

function applyPushContent(side: Side, sizeVal: string): () => void {
  const prop = side === 'left' ? 'margin-left'
    : side === 'right' ? 'margin-right'
    : side === 'top' ? 'margin-top'
    : 'margin-bottom'
  document.body.style.transition = 'margin 300ms ease'
  document.body.style.setProperty(prop, sizeVal)
  return () => {
    document.body.style.removeProperty(prop)
    document.body.style.removeProperty('transition')
  }
}

// ─── mountDrawer ──────────────────────────────────────────────────────────────

export function mountDrawer(
  component: Component,
  parent: HTMLElement,
  options: DrawerOptions = {},
): DrawerMount {
  const side: Side = options.side ?? 'right'
  const showBackdrop = options.overlay ?? true

  // ── Wrapper ──────────────────────────────────────────────────────────────────
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'drawer')
  wrapper.setAttribute('data-kb-drawer-side', side)
  wrapper.setAttribute('role', 'dialog')
  wrapper.setAttribute('aria-modal', 'true')
  wrapper.style.cssText = buildWrapperStyle(side)

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  // ── Content ───────────────────────────────────────────────────────────────────
  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'drawer')
  content.style.cssText = buildContentStyle(side, options.size)

  // ── Snap points ───────────────────────────────────────────────────────────────
  if (options.defaultSnapPoint !== undefined) {
    applySnapPoint(content, side, options.defaultSnapPoint)
  }

  // ── Mount component ───────────────────────────────────────────────────────────
  const teardownComponent = renderComponent(component, content)

  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  // ── Scroll lock ───────────────────────────────────────────────────────────────
  const unlockScroll = lockScroll()

  // ── Push content ──────────────────────────────────────────────────────────────
  let cleanupPush: (() => void) | null = null
  if (options.pushContent) {
    const axis = sizeAxis(side)
    const sizeVal = content.style[axis] || '320px'
    cleanupPush = applyPushContent(side, sizeVal)
  }

  // ── Backdrop ─────────────────────────────────────────────────────────────────
  // (Backdrop integration is handled by the global API orchestrator; the drawer
  //  renderer just marks itself as needing one via showBackdrop)
  if (showBackdrop) {
    wrapper.setAttribute('data-kb-needs-backdrop', 'true')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const snapTo = (point: string | number): void => {
    applySnapPoint(content, side, point)
  }

  const destroy = (): void => {
    unlockScroll()
    cleanupPush?.()
    teardownComponent()
    wrapper.remove()
  }

  return { wrapper, content, snapTo, destroy }
}
