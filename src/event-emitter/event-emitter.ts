import type { OverlayEvent } from '../types'

type Handler = (...args: unknown[]) => void

export class EventEmitter {
  private readonly _listeners = new Map<OverlayEvent, Set<Handler>>()

  on(event: OverlayEvent, handler: Handler): () => void {
    let set = this._listeners.get(event)
    if (!set) {
      set = new Set()
      this._listeners.set(event, set)
    }
    set.add(handler)
    return () => this.off(event, handler)
  }

  once(event: OverlayEvent, handler: Handler): void {
    const wrapper: Handler = (...args) => {
      handler(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  off(event: OverlayEvent, handler: Handler): void {
    this._listeners.get(event)?.delete(handler)
  }

  emit(event: OverlayEvent, ...args: unknown[]): void {
    const set = this._listeners.get(event)
    if (!set) return
    for (const handler of set) {
      handler(...args)
    }
  }

  removeAllListeners(): void {
    this._listeners.clear()
  }
}
