import type { OverlayType } from '../types'
import { DEFAULT_Z_INDEX } from '../portal'

// ─── Stack entry ──────────────────────────────────────────────────────────────

export interface StackEntry {
  id: string
  type: OverlayType
  priority: number
  stackGroup?: string
  isolate: boolean
  zIndex: number
  element: HTMLElement
}

// ─── Stack Manager ────────────────────────────────────────────────────────────

export class StackManager {
  private _entries: StackEntry[] = []
  private _sharedBackdrop = false

  configure(sharedBackdrop: boolean): void {
    this._sharedBackdrop = sharedBackdrop
  }

  /**
   * Add an overlay to the stack. Assigns z-index and re-orders.
   */
  push(entry: Omit<StackEntry, 'zIndex'>): StackEntry {
    const zIndex = this._computeZIndex(entry.type, entry.priority)
    const full: StackEntry = { ...entry, zIndex }
    this._entries.push(full)
    this._reorder()
    return full
  }

  /**
   * Remove an overlay from the stack by id.
   */
  remove(id: string): void {
    this._entries = this._entries.filter((e) => e.id !== id)
    this._reorder()
  }

  /**
   * Move an entry to the front (highest z-index within its type).
   */
  bringToFront(id: string): void {
    const entry = this._entries.find((e) => e.id === id)
    if (!entry) return
    // Boost priority above all others of the same type
    const maxPriority = Math.max(
      0,
      ...this._entries.filter((e) => e.type === entry.type).map((e) => e.priority),
    )
    entry.priority = maxPriority + 1
    this._reorder()
  }

  /**
   * Move an entry to the back (lowest z-index within its type).
   */
  sendToBack(id: string): void {
    const entry = this._entries.find((e) => e.id === id)
    if (!entry) return
    const minPriority = Math.min(
      0,
      ...this._entries.filter((e) => e.type === entry.type).map((e) => e.priority),
    )
    entry.priority = minPriority - 1
    this._reorder()
  }

  /**
   * Set an explicit priority for an entry.
   */
  setPriority(id: string, priority: number): void {
    const entry = this._entries.find((e) => e.id === id)
    if (!entry) return
    entry.priority = priority
    this._reorder()
  }

  /**
   * Get current stack entry for an id.
   */
  get(id: string): StackEntry | null {
    return this._entries.find((e) => e.id === id) ?? null
  }

  /**
   * Get all entries, sorted by z-index ascending.
   */
  getAll(): StackEntry[] {
    return [...this._entries]
  }

  /**
   * Whether any isolating overlay sits above a given entry.
   */
  isBlocked(id: string): boolean {
    const entry = this._entries.find((e) => e.id === id)
    if (!entry) return false
    return this._entries.some((e) => e.isolate && e.zIndex > entry.zIndex)
  }

  get sharedBackdrop(): boolean {
    return this._sharedBackdrop
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _computeZIndex(type: OverlayType, priority: number): number {
    const base = DEFAULT_Z_INDEX[type]
    // Each priority level adds 10 to the z-index to leave headroom
    return base + priority * 10
  }

  private _reorder(): void {
    // Sort by z-index, then apply computed z-index to each element
    this._entries.sort((a, b) => {
      const za = this._computeZIndex(a.type, a.priority)
      const zb = this._computeZIndex(b.type, b.priority)
      return za - zb
    })

    for (const entry of this._entries) {
      const zIndex = this._computeZIndex(entry.type, entry.priority)
      entry.zIndex = zIndex
      entry.element.style.zIndex = String(zIndex)
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const stackManager = new StackManager()
