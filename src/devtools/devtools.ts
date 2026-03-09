import type { OverlayRef } from '../types'

// ─── DevtoolsOptions ─────────────────────────────────────────────────────────

export interface DevtoolsOptions {
  /** Corner to pin the panel to. Default: 'bottom-right'. */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Z-index for the panel. Default: 99999. */
  zIndex?: number
}

// ─── DevtoolsInstance ────────────────────────────────────────────────────────

export interface DevtoolsInstance {
  /** Refresh the overlay list manually. */
  refresh: () => void
  /** Unmount the devtools panel from the DOM. */
  destroy: () => void
}

// ─── mountDevtools ───────────────────────────────────────────────────────────

/**
 * Mounts a lightweight debug overlay that shows the live list of active
 * kobiowu overlays. Pass a `getOverlays` callback that returns the current
 * list of refs (e.g. `() => kobiowu.closeAll` is not enough — you need to
 * expose the registry or pass refs manually).
 *
 * Usage:
 * ```ts
 * import { mountDevtools } from 'kobiowu'
 * const dt = mountDevtools(() => myRefs)
 * // later
 * dt.destroy()
 * ```
 */
export function mountDevtools(
  getOverlays: () => OverlayRef[],
  options: DevtoolsOptions = {},
): DevtoolsInstance {
  const pos = options.position ?? 'bottom-right'
  const zIndex = options.zIndex ?? 99999

  // ── Panel ────────────────────────────────────────────────────────────────────
  const panel = document.createElement('div')
  panel.setAttribute('data-kb-devtools', '')
  panel.style.cssText = [
    'position: fixed',
    pos.includes('bottom') ? 'bottom: 12px' : 'top: 12px',
    pos.includes('right') ? 'right: 12px' : 'left: 12px',
    `z-index: ${zIndex}`,
    'background: rgba(10, 10, 10, 0.92)',
    'color: #e8e8e8',
    'font-family: ui-monospace, SFMono-Regular, monospace',
    'font-size: 11px',
    'line-height: 1.5',
    'border-radius: 8px',
    'padding: 8px 10px',
    'min-width: 220px',
    'max-width: 320px',
    'max-height: 400px',
    'overflow-y: auto',
    'box-shadow: 0 4px 20px rgba(0,0,0,0.5)',
    'pointer-events: auto',
    'user-select: none',
  ].join('; ')

  // ── Header ───────────────────────────────────────────────────────────────────
  const header = document.createElement('div')
  header.style.cssText = [
    'display: flex',
    'align-items: center',
    'justify-content: space-between',
    'margin-bottom: 6px',
    'padding-bottom: 6px',
    'border-bottom: 1px solid rgba(255,255,255,0.12)',
  ].join('; ')

  const title = document.createElement('span')
  title.textContent = '⬛ kobiowu devtools'
  title.style.fontWeight = 'bold'

  const closeBtn = document.createElement('button')
  closeBtn.textContent = '✕'
  closeBtn.style.cssText = [
    'background: none',
    'border: none',
    'color: #aaa',
    'cursor: pointer',
    'font-size: 11px',
    'padding: 0 2px',
    'line-height: 1',
  ].join('; ')
  closeBtn.addEventListener('click', destroy)

  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // ── List ──────────────────────────────────────────────────────────────────────
  const list = document.createElement('div')
  panel.appendChild(list)

  // ── Render ───────────────────────────────────────────────────────────────────
  function render(): void {
    const refs = getOverlays()
    list.innerHTML = ''

    if (refs.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'color: #777; font-style: italic; padding: 2px 0'
      empty.textContent = 'No active overlays'
      list.appendChild(empty)
      return
    }

    for (const ref of refs) {
      const row = document.createElement('div')
      row.style.cssText = [
        'display: flex',
        'align-items: center',
        'gap: 6px',
        'padding: 3px 0',
        'border-bottom: 1px solid rgba(255,255,255,0.06)',
      ].join('; ')

      const badge = document.createElement('span')
      badge.textContent = ref.type
      badge.style.cssText = [
        'background: rgba(59, 130, 246, 0.25)',
        'color: #93c5fd',
        'border-radius: 3px',
        'padding: 0 4px',
        'font-size: 10px',
        'font-weight: bold',
        'flex-shrink: 0',
      ].join('; ')

      const idEl = document.createElement('span')
      idEl.textContent = ref.id
      idEl.style.cssText = 'color: #d4d4d4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1'

      const stateBadge = document.createElement('span')
      stateBadge.textContent = ref.state
      const stateColor = ref.state === 'open' ? '#4ade80'
        : ref.state === 'opening' ? '#facc15'
        : ref.state === 'closing' ? '#f97316'
        : '#6b7280'
      stateBadge.style.cssText = `color: ${stateColor}; flex-shrink: 0; font-size: 10px`

      row.appendChild(badge)
      row.appendChild(idEl)
      row.appendChild(stateBadge)
      list.appendChild(row)
    }
  }

  render()

  // ── Auto-refresh (poll every 500 ms) ─────────────────────────────────────────
  const interval = setInterval(render, 500)

  document.body.appendChild(panel)

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  function destroy(): void {
    clearInterval(interval)
    panel.remove()
  }

  return { refresh: render, destroy }
}
