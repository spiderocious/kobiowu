import type { OverlayType, KobiowuConfig } from './types'

// ─── Default z-index bases ────────────────────────────────────────────────────

export const DEFAULT_Z_INDEX: Record<OverlayType, number> = {
  modal: 1000,
  drawer: 1000,
  alert: 1200,
  toast: 1100,
  tooltip: 1300,
  popover: 1300,
  sheet: 1000,
  spotlight: 900,
}

// ─── Container prefix ─────────────────────────────────────────────────────────

const DEFAULT_PREFIX = 'kb'

// ─── Portal Manager ───────────────────────────────────────────────────────────

export class PortalManager {
  private _containers = new Map<OverlayType, HTMLElement>()
  private _prefix: string = DEFAULT_PREFIX
  private _target: HTMLElement | null = null

  /**
   * Apply config — call before first launch.
   */
  configure(config: Pick<KobiowuConfig, 'portalTarget' | 'containerPrefix'>): void {
    if (config.containerPrefix !== undefined) {
      this._prefix = config.containerPrefix
    }

    if (config.portalTarget !== undefined) {
      if (typeof config.portalTarget === 'string') {
        const el = document.querySelector<HTMLElement>(config.portalTarget)
        if (!el) throw new Error(`[kobiowu] portalTarget "${config.portalTarget}" not found in DOM`)
        this._target = el
      } else {
        this._target = config.portalTarget
      }
    }
  }

  /**
   * Returns (or creates) the container layer for a given overlay type.
   */
  getContainer(type: OverlayType): HTMLElement {
    const existing = this._containers.get(type)
    if (existing) return existing

    const container = document.createElement('div')
    container.setAttribute('data-kb-container', type)
    container.className = `${this._prefix}-container ${this._prefix}-container--${type}`
    container.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 0',
      'height: 0',
      'overflow: visible',
      `z-index: ${DEFAULT_Z_INDEX[type]}`,
      'pointer-events: none',
    ].join('; ')

    this._getTarget().appendChild(container)
    this._containers.set(type, container)
    return container
  }

  /**
   * Removes a type's container from the DOM (called when last overlay of that type closes).
   */
  removeContainer(type: OverlayType): void {
    const container = this._containers.get(type)
    if (!container) return
    container.remove()
    this._containers.delete(type)
  }

  /**
   * Tear down all containers — useful for cleanup in tests.
   */
  destroy(): void {
    for (const container of this._containers.values()) {
      container.remove()
    }
    this._containers.clear()
  }

  private _getTarget(): HTMLElement {
    if (this._target) return this._target
    return document.body
  }

  get prefix(): string {
    return this._prefix
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const portalManager = new PortalManager()
