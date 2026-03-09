import type { Position, Offset } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SizeOptions {
  fullscreen?: boolean
  width?: string | number
  height?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCss(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

// ─── Apply size ───────────────────────────────────────────────────────────────

/**
 * Applies sizing options to an element's inline style.
 */
export function applySize(element: HTMLElement, options: SizeOptions): void {
  if (options.fullscreen) {
    element.style.width = '100vw'
    element.style.height = '100vh'
    element.style.maxWidth = 'none'
    element.style.maxHeight = 'none'
    return
  }

  if (options.width !== undefined) element.style.width = toCss(options.width)
  if (options.height !== undefined) element.style.height = toCss(options.height)
  if (options.maxWidth !== undefined) element.style.maxWidth = toCss(options.maxWidth)
  if (options.maxHeight !== undefined) element.style.maxHeight = toCss(options.maxHeight)
}

// ─── Apply position ───────────────────────────────────────────────────────────

/**
 * Applies a `Position` (preset or custom) + optional `Offset` to an element.
 *
 * The element must have `position: fixed` or `position: absolute` set by the
 * caller (the portal/overlay wrapper handles this).
 */
export function applyPosition(
  element: HTMLElement,
  position: Position | undefined,
  offset: Offset | undefined,
): void {
  if (!position) return

  // Reset any previous positioning
  element.style.removeProperty('top')
  element.style.removeProperty('bottom')
  element.style.removeProperty('left')
  element.style.removeProperty('right')
  element.style.removeProperty('transform')

  const ox = offset?.x ?? 0
  const oy = offset?.y ?? 0

  if (typeof position === 'object' && 'x' in position) {
    // Custom { x, y }
    element.style.left = toCss(position.x)
    element.style.top = toCss(position.y)
    if (ox || oy) element.style.transform = `translate(${ox}px, ${oy}px)`
    return
  }

  // Preset
  switch (position) {
    case 'center':
      element.style.top = '50%'
      element.style.left = '50%'
      element.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`
      break

    case 'top':
      element.style.top = `${oy}px`
      element.style.left = '50%'
      element.style.transform = `translateX(calc(-50% + ${ox}px))`
      break

    case 'bottom':
      element.style.bottom = `${oy}px`
      element.style.left = '50%'
      element.style.transform = `translateX(calc(-50% + ${ox}px))`
      break

    case 'left':
      element.style.left = `${ox}px`
      element.style.top = '50%'
      element.style.transform = `translateY(calc(-50% + ${oy}px))`
      break

    case 'right':
      element.style.right = `${ox}px`
      element.style.top = '50%'
      element.style.transform = `translateY(calc(-50% + ${oy}px))`
      break

    case 'top-left':
      element.style.top = `${oy}px`
      element.style.left = `${ox}px`
      break

    case 'top-right':
      element.style.top = `${oy}px`
      element.style.right = `${ox}px`
      break

    case 'top-center':
      element.style.top = `${oy}px`
      element.style.left = '50%'
      element.style.transform = `translateX(calc(-50% + ${ox}px))`
      break

    case 'bottom-left':
      element.style.bottom = `${oy}px`
      element.style.left = `${ox}px`
      break

    case 'bottom-right':
      element.style.bottom = `${oy}px`
      element.style.right = `${ox}px`
      break

    case 'bottom-center':
      element.style.bottom = `${oy}px`
      element.style.left = '50%'
      element.style.transform = `translateX(calc(-50% + ${ox}px))`
      break
  }
}
