"use client";
declare global {
  interface Window {
    __memelliAppBridge?: {
      app: {
        osState: Record<string, any>
        getMode: () => string | null
        setMode: (m: string) => void
        isMobile: boolean
        user: any
        openWindow: (id: string) => void
        subscribe: (key: string, fn: (val: any) => void) => () => void
        notify: (key: string, val: any) => void
        cleanup: (nodeName: string) => void
      }
    }
  }
}

/**
 * Internal holder for store accessors – populated by StoreBridgeShim.
 */
let storeAccess: {
  getMode: () => string | null
  setMode: (m: string) => void
  getUser: () => any
  getIsMobile: () => boolean
} | null = null

/**
 * Simple pub/sub registry used by the bridge.
 */
let subscribers: Record<string, Set<(val: any) => void>> = {}

/**
 * Helper to push store getters/setters into the bridge.
 */
function setStoreAccess(access: {
  getMode: () => string | null
  setMode: (m: string) => void
  getUser: () => any
  getIsMobile: () => boolean
}) {
  storeAccess = access

  // Notify initial values so any external listeners get the current state.
  const bridge = ensureBridge()
  if (bridge) {
    bridge.app.notify('mode', access.getMode())
    bridge.app.notify('isMobile', access.getIsMobile())
  }
}

/**
 * Idempotent creation / retrieval of the global bridge.
 */
export function ensureBridge() {
  if (typeof window === 'undefined') return null

  if (!window.__memelliAppBridge) {
    const bridge = {
      app: {
        osState: {} as Record<string, any>,

        getMode() {
          return storeAccess?.getMode?.() ?? null
        },

        setMode(m: string) {
          storeAccess?.setMode?.(m)
        },

        get isMobile() {
          return storeAccess?.getIsMobile?.() ?? false
        },

        get user() {
          return storeAccess?.getUser?.() ?? null
        },

        openWindow(id: string) {
          window.dispatchEvent(
            new CustomEvent('memelli:open-app', {
              detail: { appId: id },
            })
          )
        },

        subscribe(key: string, fn: (val: any) => void) {
          if (!subscribers[key]) subscribers[key] = new Set()
          subscribers[key].add(fn)

          // Return an unsubscribe function.
          return () => {
            subscribers[key]?.delete(fn)
            if (subscribers[key]?.size === 0) delete subscribers[key]
          }
        },

        notify(key: string, val: any) {
          if (subscribers[key]) {
            subscribers[key].forEach((cb) => {
              try {
                cb(val)
              } catch {
                // swallow errors from subscriber callbacks
              }
            })
          }
        },

        cleanup(_nodeName: string) {
          // For now we simply clear all listeners – the nodeName argument is kept
          // for API compatibility with the DB chrome side.
          subscribers = {}
        },
      },
    }

    window.__memelliAppBridge = bridge
  }

  return window.__memelliAppBridge
}

/**
 * React shim component that wires Zustand stores into the bridge.
 * Mount this once (e.g., at the top level of the app).
 */
export function StoreBridgeShim(): null {
  // Import React and the stores lazily so they are only evaluated client‑side.
  const React = require('react')
  const { useEffect } = React
  const { useOsMode } = require('../_lib/os-mode-store')
  const { useWindowStore } = require('../_lib/window-store')
  const { useAuth } = require('@/contexts/auth')

  const osMode = useOsMode()
  const windowStore = useWindowStore()
  const auth = useAuth()

  // Push the current getters/setters into the bridge whenever they change.
  useEffect(() => {
    setStoreAccess({
      getMode: () => osMode.mode,
      setMode: (m: string) => osMode.setMode(m),
      getUser: () => auth.user,
      getIsMobile: () => windowStore.isMobile,
    })
  }, [osMode.mode, osMode.setMode, windowStore.isMobile, auth.user])

  return null
}