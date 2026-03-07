import type { BackdropType, OverlayOptions } from './types'

// ─── Backdrop element ─────────────────────────────────────────────────────────

export interface BackdropConfig {
  type: BackdropType
  color?: string
  blur?: number
  opacity?: number
  zIndex: number
  onClick?: () => void
}

function buildBackdropStyle(config: BackdropConfig): string {
  const parts: string[] = [
    'position: fixed',
    'inset: 0',
    `z-index: ${config.zIndex}`,
    'transition: opacity 200ms ease, backdrop-filter 200ms ease',
  ]

  const opacity = config.opacity ?? defaultOpacity(config.type)
  const color = config.color ?? defaultColor(config.type)

  switch (config.type) {
    case 'dim':
      parts.push(`background: ${color}`)
      parts.push(`opacity: ${opacity}`)
      break
    case 'blur':
      parts.push(`background: ${color}`)
      parts.push(`opacity: ${opacity}`)
      parts.push(`backdrop-filter: blur(${config.blur ?? 4}px)`)
      break
    case 'frosted':
      parts.push(`background: ${color}`)
      parts.push(`opacity: ${opacity}`)
      parts.push(`backdrop-filter: blur(${config.blur ?? 12}px) saturate(180%)`)
      break
    case 'fade':
      parts.push(`background: ${color}`)
      parts.push(`opacity: ${opacity}`)
      break
    case 'custom':
      if (color) parts.push(`background: ${color}`)
      if (opacity !== undefined) parts.push(`opacity: ${opacity}`)
      if (config.blur) parts.push(`backdrop-filter: blur(${config.blur}px)`)
      break
    case 'none':
      parts.push('pointer-events: none')
      parts.push('opacity: 0')
      break
  }

  return parts.join('; ')
}

function defaultOpacity(type: BackdropType): number {
  switch (type) {
    case 'dim': return 0.5
    case 'blur': return 0.3
    case 'frosted': return 0.6
    case 'fade': return 0.4
    default: return 0
  }
}

function defaultColor(type: BackdropType): string {
  switch (type) {
    case 'frosted': return 'rgba(255,255,255,0.1)'
    default: return 'rgba(0,0,0,1)'
  }
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

export class Backdrop {
  readonly element: HTMLElement

  constructor(config: BackdropConfig) {
    this.element = document.createElement('div')
    this.element.setAttribute('data-kb-backdrop', config.type)
    this.element.setAttribute('aria-hidden', 'true')
    this.element.style.cssText = buildBackdropStyle(config)

    if (config.onClick) {
      this.element.addEventListener('click', config.onClick)
    }
  }

  show(parent: HTMLElement): void {
    parent.appendChild(this.element)
  }

  hide(): void {
    this.element.style.opacity = '0'
  }

  remove(): void {
    this.element.remove()
  }

  update(config: Partial<BackdropConfig>): void {
    if (config.type !== undefined) {
      this.element.setAttribute('data-kb-backdrop', config.type)
    }
    const currentType = (this.element.getAttribute('data-kb-backdrop') ?? 'dim') as BackdropType
    const merged: BackdropConfig = {
      type: config.type ?? currentType,
      zIndex: config.zIndex ?? parseInt(this.element.style.zIndex, 10),
      ...(config.color !== undefined ? { color: config.color } : {}),
      ...(config.blur !== undefined ? { blur: config.blur } : {}),
      ...(config.opacity !== undefined ? { opacity: config.opacity } : {}),
    }
    this.element.style.cssText = buildBackdropStyle(merged)
  }
}

// ─── Backdrop Manager ─────────────────────────────────────────────────────────

export class BackdropManager {
  private _backdrops = new Map<string, Backdrop>()
  private _shared: Backdrop | null = null
  private _sharedRefCount = 0

  createForOverlay(id: string, options: OverlayOptions, zIndex: number, parent: HTMLElement): Backdrop | null {
    const type = options.backdrop ?? 'none'
    if (type === 'none') return null

    const backdrop = new Backdrop({
      type,
      zIndex: zIndex - 1,
      ...(options.backdropColor !== undefined ? { color: options.backdropColor } : {}),
      ...(options.backdropBlur !== undefined ? { blur: options.backdropBlur } : {}),
      ...(options.backdropOpacity !== undefined ? { opacity: options.backdropOpacity } : {}),
    })

    backdrop.show(parent)
    this._backdrops.set(id, backdrop)
    return backdrop
  }

  createShared(options: OverlayOptions, zIndex: number, parent: HTMLElement): void {
    if (!this._shared) {
      this._shared = new Backdrop({
        type: options.backdrop ?? 'dim',
        zIndex: zIndex - 1,
        ...(options.backdropColor !== undefined ? { color: options.backdropColor } : {}),
        ...(options.backdropBlur !== undefined ? { blur: options.backdropBlur } : {}),
        ...(options.backdropOpacity !== undefined ? { opacity: options.backdropOpacity } : {}),
      })
      this._shared.show(parent)
    }
    this._sharedRefCount++
  }

  removeForOverlay(id: string): void {
    const backdrop = this._backdrops.get(id)
    if (!backdrop) return
    backdrop.remove()
    this._backdrops.delete(id)
  }

  releaseShared(): void {
    this._sharedRefCount = Math.max(0, this._sharedRefCount - 1)
    if (this._sharedRefCount === 0 && this._shared) {
      this._shared.remove()
      this._shared = null
    }
  }

  get(id: string): Backdrop | null {
    return this._backdrops.get(id) ?? null
  }
}

export const backdropManager = new BackdropManager()
