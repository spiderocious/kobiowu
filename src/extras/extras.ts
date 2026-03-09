import type { Component, OverlayOptions } from '../types'
import { renderComponent } from '../renderer'
import { lockScroll, trapFocus } from '../lifecycle'
import { applyPosition, applySize } from '../positioning'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function toCss(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export interface TooltipOptions extends OverlayOptions {
  /** Element the tooltip is anchored to */
  anchor?: HTMLElement
  /** Preferred placement relative to anchor */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TooltipMount {
  wrapper: HTMLElement
  content: HTMLElement
  destroy: () => void
}

/**
 * Lightweight anchor-attached overlay (tooltip).
 * Positions itself relative to `anchor` if provided, else `position` is used.
 */
export function mountTooltip(
  component: Component,
  parent: HTMLElement,
  options: TooltipOptions = {},
): TooltipMount {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'tooltip')
  wrapper.setAttribute('role', 'tooltip')
  wrapper.style.cssText = 'position: fixed; pointer-events: none; box-sizing: border-box; z-index: 1300'

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)
  if (options.zIndex !== undefined) wrapper.style.zIndex = String(options.zIndex)

  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'tooltip')

  const teardown = renderComponent(component, content)
  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  // Position relative to anchor after mount (so dimensions are available)
  if (options.anchor) {
    positionNearAnchor(wrapper, options.anchor, options.placement ?? 'top')
  } else if (options.position) {
    applyPosition(wrapper, options.position, options.offset)
  }

  const destroy = (): void => {
    teardown()
    wrapper.remove()
  }

  return { wrapper, content, destroy }
}

function positionNearAnchor(
  el: HTMLElement,
  anchor: HTMLElement,
  placement: 'top' | 'bottom' | 'left' | 'right',
): void {
  const rect = anchor.getBoundingClientRect()
  const gap = 6
  switch (placement) {
    case 'top':
      el.style.left = `${rect.left + rect.width / 2}px`
      el.style.top = `${rect.top - gap}px`
      el.style.transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      el.style.left = `${rect.left + rect.width / 2}px`
      el.style.top = `${rect.bottom + gap}px`
      el.style.transform = 'translateX(-50%)'
      break
    case 'left':
      el.style.left = `${rect.left - gap}px`
      el.style.top = `${rect.top + rect.height / 2}px`
      el.style.transform = 'translate(-100%, -50%)'
      break
    case 'right':
      el.style.left = `${rect.right + gap}px`
      el.style.top = `${rect.top + rect.height / 2}px`
      el.style.transform = 'translateY(-50%)'
      break
  }
}

// ─── Popover ──────────────────────────────────────────────────────────────────

export interface PopoverOptions extends OverlayOptions {
  anchor?: HTMLElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface PopoverMount {
  wrapper: HTMLElement
  content: HTMLElement
  destroy: () => void
}

/**
 * Richer anchor-attached overlay (popover). Interactive — pointer events on.
 */
export function mountPopover(
  component: Component,
  parent: HTMLElement,
  options: PopoverOptions = {},
): PopoverMount {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'popover')
  wrapper.setAttribute('role', 'dialog')
  wrapper.style.cssText = 'position: fixed; pointer-events: auto; box-sizing: border-box; z-index: 1300'

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)
  if (options.zIndex !== undefined) wrapper.style.zIndex = String(options.zIndex)

  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'popover')

  applySize(content, {
    ...(options.width !== undefined ? { width: options.width } : {}),
    ...(options.height !== undefined ? { height: options.height } : {}),
    ...(options.maxWidth !== undefined ? { maxWidth: options.maxWidth } : {}),
  })

  const teardown = renderComponent(component, content)
  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  if (options.anchor) {
    positionNearAnchor(wrapper, options.anchor, options.placement ?? 'bottom')
  } else if (options.position) {
    applyPosition(wrapper, options.position, options.offset)
  }

  const destroy = (): void => {
    teardown()
    wrapper.remove()
  }

  return { wrapper, content, destroy }
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export interface SheetOptions extends OverlayOptions {
  /** Height of the sheet as a CSS value. Defaults to '50vh'. */
  height?: string | number
  snapPoints?: Array<string | number>
  defaultSnapPoint?: string | number
}

export interface SheetMount {
  wrapper: HTMLElement
  content: HTMLElement
  snapTo: (point: string | number) => void
  destroy: () => void
}

/**
 * Bottom sheet — slides up from the bottom edge of the viewport.
 */
export function mountSheet(
  component: Component,
  parent: HTMLElement,
  options: SheetOptions = {},
): SheetMount {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'sheet')
  wrapper.setAttribute('role', 'dialog')
  wrapper.setAttribute('aria-modal', 'true')
  wrapper.style.cssText = [
    'position: fixed',
    'bottom: 0',
    'left: 0',
    'right: 0',
    'display: flex',
    'justify-content: center',
    'pointer-events: auto',
    'box-sizing: border-box',
    'z-index: 1000',
  ].join('; ')

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'sheet')

  const initialHeight = options.defaultSnapPoint ?? options.height ?? '50vh'
  content.style.cssText = [
    'width: 100%',
    `height: ${toCss(initialHeight)}`,
    'overflow-y: auto',
    'box-sizing: border-box',
  ].join('; ')

  const teardown = renderComponent(component, content)
  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  const cleanupFocus = trapFocus(wrapper)
  const unlockScroll = lockScroll()

  const snapTo = (point: string | number): void => {
    content.style.height = toCss(point)
  }

  const destroy = (): void => {
    cleanupFocus()
    unlockScroll()
    teardown()
    wrapper.remove()
  }

  return { wrapper, content, snapTo, destroy }
}

// ─── Spotlight ────────────────────────────────────────────────────────────────

export interface SpotlightOptions extends OverlayOptions {
  /** Darken the overlay. Defaults to true. */
  dim?: boolean
}

export interface SpotlightMount {
  wrapper: HTMLElement
  content: HTMLElement
  destroy: () => void
}

/**
 * Full-screen focus overlay — covers the entire viewport with optional dim,
 * content rendered centred on top.
 */
export function mountSpotlight(
  component: Component,
  parent: HTMLElement,
  options: SpotlightOptions = {},
): SpotlightMount {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-kb-overlay', 'spotlight')
  wrapper.setAttribute('role', 'dialog')
  wrapper.setAttribute('aria-modal', 'true')
  wrapper.setAttribute('tabindex', '-1')

  const dim = options.dim ?? true
  wrapper.style.cssText = [
    'position: fixed',
    'inset: 0',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'pointer-events: auto',
    'box-sizing: border-box',
    'z-index: 900',
    dim ? 'background: rgba(0,0,0,0.7)' : '',
  ]
    .filter(Boolean)
    .join('; ')

  if (options.className) wrapper.className = options.className
  if (options.style) Object.assign(wrapper.style, options.style)

  const content = document.createElement('div')
  content.setAttribute('data-kb-content', 'spotlight')
  content.style.cssText = 'position: relative; pointer-events: auto; box-sizing: border-box'

  applySize(content, {
    ...(options.width !== undefined ? { width: options.width } : {}),
    ...(options.height !== undefined ? { height: options.height } : {}),
  })

  const teardown = renderComponent(component, content)
  wrapper.appendChild(content)
  parent.appendChild(wrapper)

  const cleanupFocus = trapFocus(wrapper)
  const unlockScroll = lockScroll()

  const destroy = (): void => {
    cleanupFocus()
    unlockScroll()
    teardown()
    wrapper.remove()
  }

  return { wrapper, content, destroy }
}
