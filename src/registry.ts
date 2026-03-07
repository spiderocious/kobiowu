import type { OverlayRef, OverlayType, OverlayFilter } from './types'

// ─── ID generation ────────────────────────────────────────────────────────────

let _counter = 0

export function generateId(type: OverlayType): string {
  return `kb-${type}-${++_counter}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export class OverlayRegistry {
  private readonly _map = new Map<string, OverlayRef>()

  register(ref: OverlayRef): void {
    this._map.set(ref.id, ref)
  }

  unregister(id: string): void {
    this._map.delete(id)
  }

  get(id: string): OverlayRef | null {
    return this._map.get(id) ?? null
  }

  isOpen(id: string): boolean {
    const ref = this._map.get(id)
    return ref !== undefined && (ref.state === 'open' || ref.state === 'opening')
  }

  getAll(filter?: OverlayFilter): OverlayRef[] {
    const refs = Array.from(this._map.values())
    if (!filter) return refs

    return refs.filter((ref) => {
      if (filter.type !== undefined && ref.type !== filter.type) return false
      if (filter.group !== undefined) {
        // OverlayRef doesn't expose group directly; group lives on options.
        // We cast to internal ref to access _group.
        const internal = ref as OverlayRef & { _group?: string }
        if (internal._group !== filter.group) return false
      }
      return true
    })
  }

  has(id: string): boolean {
    return this._map.has(id)
  }

  get size(): number {
    return this._map.size
  }

  clear(): void {
    this._map.clear()
  }
}

// ─── Singleton registry ───────────────────────────────────────────────────────

export const registry = new OverlayRegistry()
