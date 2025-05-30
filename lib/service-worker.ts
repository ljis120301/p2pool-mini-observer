'use client'

import { logger } from './logger'

interface ServiceWorkerManager {
  register: () => Promise<ServiceWorkerRegistration | null>
  unregister: () => Promise<boolean>
  update: () => Promise<void>
  clearCache: () => Promise<boolean>
  isSupported: () => boolean
}

class P2PoolServiceWorker implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null

  isSupported = (): boolean => {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator &&
           typeof caches !== 'undefined'
  }

  register = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!this.isSupported()) {
      logger.debug('Service Workers not supported')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      logger.debug('Service Worker registered successfully')

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdate()
            }
          })
        }
      })

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          logger.debug('Service Worker: Cache updated')
        }
      })

      return this.registration
    } catch (error) {
      logger.error('Service Worker registration failed', error)
      return null
    }
  }

  unregister = async (): Promise<boolean> => {
    if (!this.isSupported() || !this.registration) {
      return false
    }

    try {
      const result = await this.registration.unregister()
      logger.debug('Service Worker unregistered')
      this.registration = null
      return result
    } catch (error) {
      logger.error('Service Worker unregistration failed', error)
      return false
    }
  }

  update = async (): Promise<void> => {
    if (!this.registration) {
      throw new Error('No service worker registration found')
    }

    try {
      await this.registration.update()
      logger.debug('Service Worker update check completed')
    } catch (error) {
      logger.error('Service Worker update failed', error)
      throw error
    }
  }

  clearCache = async (): Promise<boolean> => {
    if (!this.isSupported() || !navigator.serviceWorker.controller) {
      return false
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success)
      }

      const controller = navigator.serviceWorker.controller
      if (controller) {
        controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      } else {
        resolve(false)
      }

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000)
    })
  }

  private notifyUpdate(): void {
    // You can customize this notification method
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check permission and show notification
      if (Notification.permission === 'granted') {
        new Notification('P2Pool Observer Updated', {
          body: 'A new version is available. Refresh to update.',
          icon: '/favicon.ico',
          tag: 'app-update'
        })
      }
    }

    // Also dispatch a custom event
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }))
  }

  // Install app as PWA
  installApp = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    // Check if beforeinstallprompt event was fired
    const deferredPrompt = (window as any).deferredPrompt
    if (!deferredPrompt) {
      return false
    }

    try {
      // Show install prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      logger.debug('PWA install prompt result:', outcome)
      
      // Clear the deferredPrompt
      ;(window as any).deferredPrompt = null
      
      return outcome === 'accepted'
    } catch (error) {
      logger.error('PWA installation failed', error)
      return false
    }
  }

  // Check if app is running as PWA
  isPWA = (): boolean => {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://')
  }

  // Get cache info
  getCacheInfo = async (): Promise<{ size: number, count: number } | null> => {
    if (!this.isSupported() || typeof caches === 'undefined') return null

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0
      let totalCount = 0

      for (const name of cacheNames) {
        const cache = await caches.open(name)
        const requests = await cache.keys()
        totalCount += requests.length
        
        // Estimate size (rough calculation)
        for (const request of requests) {
          const response = await cache.match(request)
          if (response) {
            totalSize += parseInt(response.headers.get('content-length') || '1024')
          }
        }
      }

      return { size: totalSize, count: totalCount }
    } catch (error) {
      logger.error('Failed to get cache info:', error)
      return null
    }
  }
}

// Export singleton instance
export const serviceWorker = new P2PoolServiceWorker()

// Hook for React components
export function useServiceWorker() {
  return {
    register: serviceWorker.register,
    unregister: serviceWorker.unregister,
    update: serviceWorker.update,
    clearCache: serviceWorker.clearCache,
    installApp: serviceWorker.installApp,
    isSupported: serviceWorker.isSupported(),
    isPWA: serviceWorker.isPWA(),
    getCacheInfo: serviceWorker.getCacheInfo,
  }
}

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorker.register().catch(error => {
    logger.error('Auto service worker registration failed', error)
  })
} 