// ─── Overlay Types ────────────────────────────────────────────────────────────

export type OverlayType =
  | 'modal'
  | 'toast'
  | 'drawer'
  | 'alert'
  | 'tooltip'
  | 'popover'
  | 'sheet'
  | 'spotlight'

export type OverlayState = 'opening' | 'open' | 'closing' | 'closed'

export type CloseReason = string

export type OverlayEvent = 'open' | 'close' | 'focus' | 'blur' | 'dragstart' | 'dragend'

// ─── Position ─────────────────────────────────────────────────────────────────

export type PositionPreset =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'

export type Position = PositionPreset | { x: number | string; y: number | string }

export interface Offset {
  x?: number
  y?: number
}

export interface XY {
  x: number
  y: number
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

export type BackdropType = 'blur' | 'dim' | 'fade' | 'frosted' | 'none' | 'custom'

// ─── Animation ────────────────────────────────────────────────────────────────

export type AnimationPreset = 'fade' | 'scale' | 'slide' | 'none'

export interface AnimationConfig {
  keyframes: Keyframe[] | PropertyIndexedKeyframes
  options?: KeyframeAnimationOptions
}

export type AnimationValue = AnimationPreset | AnimationConfig | string

// ─── Drag ─────────────────────────────────────────────────────────────────────

export type DragAxis = 'both' | 'x' | 'y'
export type DragBounds = 'viewport' | 'parent' | DOMRect

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

// ─── Alert ────────────────────────────────────────────────────────────────────

export type AlertType = 'confirm' | 'prompt' | 'info' | 'destructive'

// ─── Component ────────────────────────────────────────────────────────────────

export type RenderFn = (container: HTMLElement) => void | (() => void)

export type Component =
  | HTMLElement
  | string
  | RenderFn
  | URL

// ─── Renderer ─────────────────────────────────────────────────────────────────

export type OverlayRenderer = (
  component: Component,
  container: HTMLElement,
  options: OverlayOptions,
) => void | (() => void)

// ─── Options ──────────────────────────────────────────────────────────────────

export interface OverlayOptions {
  // Identity
  id?: string
  group?: string

  // Backdrop
  backdrop?: BackdropType
  backdropColor?: string
  backdropBlur?: number
  backdropOpacity?: number
  backdropClickClosable?: boolean

  // Sizing
  fullscreen?: boolean
  width?: string | number
  height?: string | number
  maxWidth?: string | number
  maxHeight?: string | number

  // Positioning
  position?: Position
  offset?: Offset

  // Styling
  className?: string
  style?: Record<string, string>
  zIndex?: number

  // Stacking
  priority?: number
  stackGroup?: string
  isolate?: boolean

  // Animation
  enterAnimation?: AnimationValue
  exitAnimation?: AnimationValue
  animationDuration?: number

  // Dragging
  draggable?: boolean
  dragHandle?: string | HTMLElement
  dragBounds?: DragBounds
  dragAxis?: DragAxis
  initialPosition?: XY

  // Resizing
  resizable?: boolean
  resizeHandles?: ResizeHandle[]

  // Lifecycle
  onOpen?: (ref: OverlayRef) => void
  onClose?: (ref: OverlayRef, reason: CloseReason) => void
  onFocus?: (ref: OverlayRef) => void
  onBlur?: (ref: OverlayRef) => void
  onDragStart?: (ref: OverlayRef, pos: XY) => void
  onDragEnd?: (ref: OverlayRef, pos: XY) => void
  onBeforeClose?: (ref: OverlayRef) => boolean | Promise<boolean>

  // Behavior
  closeOnEscape?: boolean
  trapFocus?: boolean
  lockScroll?: boolean
  autoCloseAfter?: number
  keepMounted?: boolean
  singleton?: boolean

  // Data
  data?: Record<string, unknown>
}

export interface ModalOptions extends OverlayOptions {
  centered?: boolean
  scrollable?: boolean
}

export interface ToastOptions extends OverlayOptions {
  position?: ToastPosition
  duration?: number
  pauseOnHover?: boolean
  pauseOnFocusLoss?: boolean
  showProgress?: boolean
  limit?: number
  gap?: number
  expand?: boolean
  swipeToDismiss?: boolean | 'x' | 'y'
  type?: ToastType
  updateable?: boolean
}

export interface DrawerOptions extends OverlayOptions {
  side?: 'left' | 'right' | 'top' | 'bottom'
  size?: string | number
  pushContent?: boolean
  overlay?: boolean
  snapPoints?: Array<string | number>
  defaultSnapPoint?: string | number
}

export interface AlertOptions extends OverlayOptions {
  type?: AlertType
  onConfirm?: (value?: string) => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
}

// ─── OverlayRef ───────────────────────────────────────────────────────────────

export interface OverlayRef {
  // Identity
  readonly id: string
  readonly type: OverlayType
  readonly state: OverlayState

  // Control
  close(reason?: string): Promise<void>
  open(): Promise<void>
  toggle(): Promise<void>
  focus(): void

  // Live patching
  patch(options: Partial<OverlayOptions>): void

  // Position
  moveTo(x: number, y: number): void
  resetPosition(): void
  getPosition(): XY

  // Content
  update(component: Component): void
  getData(): Record<string, unknown>
  setData(data: Record<string, unknown>): void

  // Toast-specific
  setType(type: ToastType): void
  setProgress(value: number): void

  // Stack control
  sendToBack(): void
  bringToFront(): void
  setPriority(priority: number): void

  // Events
  on(event: OverlayEvent, handler: (...args: unknown[]) => void): () => void
  once(event: OverlayEvent, handler: (...args: unknown[]) => void): void
  off(event: OverlayEvent, handler: (...args: unknown[]) => void): void

  // DOM access
  readonly element: HTMLElement | null
  readonly contentElement: HTMLElement | null
}

// ─── Global Config ────────────────────────────────────────────────────────────

export interface KobiowuConfig {
  portalTarget?: HTMLElement | string
  containerPrefix?: string
  sharedBackdrop?: boolean
  animationPreset?: AnimationPreset
  animationDuration?: number
  ariaLive?: 'polite' | 'assertive'
  defaults?: {
    modal?: Partial<ModalOptions>
    toast?: Partial<ToastOptions>
    drawer?: Partial<DrawerOptions>
    alert?: Partial<AlertOptions>
  }
  zIndexBase?: {
    modal?: number
    toast?: number
    drawer?: number
    alert?: number
  }
  renderers?: {
    modal?: OverlayRenderer
    toast?: OverlayRenderer
    drawer?: OverlayRenderer
    alert?: OverlayRenderer
  }
}

// ─── Registry Filter ──────────────────────────────────────────────────────────

export interface OverlayFilter {
  type?: OverlayType
  group?: string
}
