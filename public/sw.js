const CACHE_NAME = 'p2pool-observer-v1'
const STATIC_CACHE_NAME = 'p2pool-static-v1'
const API_CACHE_NAME = 'p2pool-api-v1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
]

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/pool_info/,
  /\/api\/shares/,
  /\/api\/found_blocks/,
  /\/api\/miner_info/,
  /\/api\/payouts/,
]

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  API_POOL: 30 * 1000, // 30 seconds
  API_MINER: 60 * 1000, // 1 minute
  API_BLOCKS: 5 * 60 * 1000, // 5 minutes
  FALLBACK: 10 * 60 * 1000, // 10 minutes
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS.filter(asset => !asset.includes('_next')))
      }),
      // Initialize API cache
      caches.open(API_CACHE_NAME).then(() => {
        console.log('Service Worker: API cache initialized')
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else {
    event.respondWith(handlePageRequest(request))
  }
})

// Check if request is for API endpoint
function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('p2pool.observer') ||
         url.hostname.includes('api.coingecko.com')
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.includes('/_next/') ||
         url.pathname.includes('/static/') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js')
}

// Handle API requests with cache-first strategy and freshness check
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  const cacheKey = getCacheKey(request)
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(API_CACHE_NAME)
      const responseToCache = networkResponse.clone()
      
      // Add timestamp for cache invalidation
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      await cache.put(cacheKey, cachedResponse)
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    // Network failed, try cache
    console.log('Service Worker: Network failed, trying cache for:', url.pathname)
    
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(cacheKey)
    
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cached-at')
      const maxAge = getCacheMaxAge(url.pathname)
      
      // Check if cache is still valid
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < maxAge) {
        console.log('Service Worker: Serving from cache:', url.pathname)
        return cachedResponse
      } else {
        console.log('Service Worker: Cache expired for:', url.pathname)
      }
    }
    
    // Return offline page or error
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection and no cached data available',
      timestamp: Date.now()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    return await fetch(request)
  } catch (error) {
    // Try to serve cached version of main page
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match('/')
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>P2Pool Observer - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: #0f172a;
              color: #e2e8f0;
            }
            .offline-message {
              max-width: 400px;
              margin: 2rem auto;
              padding: 2rem;
              background: #1e293b;
              border-radius: 8px;
              border: 1px solid #334155;
            }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 1rem;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>P2Pool Observer</h1>
            <h2>You're offline</h2>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
  }
}

// Generate cache key for requests
function getCacheKey(request) {
  const url = new URL(request.url)
  
  // For API requests, include relevant query parameters
  const relevantParams = ['limit', 'height', 'address']
  const searchParams = new URLSearchParams()
  
  relevantParams.forEach(param => {
    if (url.searchParams.has(param)) {
      searchParams.set(param, url.searchParams.get(param))
    }
  })
  
  return `${url.origin}${url.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
}

// Get cache max age based on endpoint
function getCacheMaxAge(pathname) {
  if (pathname.includes('pool_info')) {
    return CACHE_DURATIONS.API_POOL
  } else if (pathname.includes('miner_info') || pathname.includes('shares')) {
    return CACHE_DURATIONS.API_MINER
  } else if (pathname.includes('found_blocks') || pathname.includes('payouts')) {
    return CACHE_DURATIONS.API_BLOCKS
  }
  
  return CACHE_DURATIONS.FALLBACK
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true })
    }).catch(error => {
      event.ports[0].postMessage({ success: false, error: error.message })
    })
  }
})

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('Service Worker: All caches cleared')
}

// Background sync for failed requests (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(handleBackgroundSync())
    }
  })
}

async function handleBackgroundSync() {
  console.log('Service Worker: Background sync triggered')
  // Implement background sync logic here if needed
} 