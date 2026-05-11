/**
 * Metatecno Service Worker
 * 提供离线支持、缓存优化和性能提升
 * Version: 1.0.0
 */

const CACHE_VERSION = 'metatecno-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 立即缓存（安装时）
  PRECACHE: [
    '/',
    '/assets/styles.min.css',
    '/assets/enhanced-styles.min.css',
    '/assets/enhanced-site.min.js',
    '/assets/contact-fab.min.js',
    '/assets/logo.svg',
    '/assets/favicon.svg',
    '/offline.html'
  ],
  
  // 缓存优先（长期不变的资源）
  CACHE_FIRST: [
    '/assets/fonts/',
    '/assets/icons/',
    '/assets/media/'
  ],
  
  // 网络优先（频繁更新的内容）
  NETWORK_FIRST: [
    '/api/',
    '/zh/',
    '/en/',
    '/products/',
    '/contact/'
  ],
  
  // 仅网络（不缓存）
  NETWORK_ONLY: [
    '/analytics/',
    '/tracking/',
    '/admin/'
  ]
};

// 最大缓存大小和时间
const MAX_CACHE_SIZE = 50; // 最多缓存50个资源
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7天

// ============================================
// Service Worker 安装
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources');
        return cache.addAll(CACHE_STRATEGIES.PRECACHE);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // 立即激活新的 SW
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================
// Service Worker 激活
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // 立即控制所有页面
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// ============================================
// 请求拦截和缓存策略
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 判断缓存策略
  const strategy = getCacheStrategy(url.pathname);

  switch (strategy) {
    case 'CACHE_FIRST':
      event.respondWith(cacheFirst(request));
      break;
    case 'NETWORK_FIRST':
      event.respondWith(networkFirst(request));
      break;
    case 'NETWORK_ONLY':
      event.respondWith(fetch(request));
      break;
    default:
      event.respondWith(staleWhileRevalidate(request));
  }
});

// ============================================
// 缓存策略函数
// ============================================

// 缓存优先策略（适合静态资源）
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // 克隆响应，因为响应只能使用一次
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
      console.log('[SW] Cached new resource:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return caches.match('/offline.html');
  }
}

// 网络优先策略（适合动态内容）
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
      console.log('[SW] Updated cache from network:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await cache.match(request);
    return cached || caches.match('/offline.html');
  }
}

// Stale-While-Revalidate（返回缓存同时更新）
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // 立即返回缓存（如果有）
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('[SW] Background updated:', request.url);
    }
    return response;
  });

  return cached || fetchPromise;
}

// ============================================
// 辅助函数
// ============================================

// 获取URL的缓存策略
function getCacheStrategy(pathname) {
  // 检查是否匹配 NETWORK_ONLY
  if (CACHE_STRATEGIES.NETWORK_ONLY.some(pattern => pathname.startsWith(pattern))) {
    return 'NETWORK_ONLY';
  }

  // 检查是否匹配 NETWORK_FIRST
  if (CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pathname.startsWith(pattern))) {
    return 'NETWORK_FIRST';
  }

  // 检查是否匹配 CACHE_FIRST
  if (CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pathname.startsWith(pattern))) {
    return 'CACHE_FIRST';
  }

  // 默认使用 stale-while-revalidate
  return 'STALE_WHILE_REVALIDATE';
}

// 限制缓存大小
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    console.log(`[SW] Cache size (${keys.length}) exceeds limit (${maxSize}), cleaning...`);
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxSize);
  }
}

// 清理过期缓存
async function cleanOldCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const now = Date.now();

  for (const request of keys) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const cacheDate = new Date(dateHeader).getTime();
      if (now - cacheDate > MAX_CACHE_AGE) {
        console.log('[SW] Deleting expired cache:', request.url);
        await cache.delete(request);
      }
    }
  }
}

// ============================================
// 后台同步
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 实现数据同步逻辑
  console.log('[SW] Syncing data...');
}

// ============================================
// 推送通知
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification from Metatecno',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'metatecno-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '查看',
        icon: '/assets/icons/open.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/assets/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Metatecno', options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ============================================
// 消息通信
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanOldCache());
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ size: keys.length });
      });
    });
  }
});

// ============================================
// 定期维护
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'clean-cache') {
    event.waitUntil(
      Promise.all([
        cleanOldCache(),
        limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE)
      ])
    );
  }
});

// ============================================
// 错误处理
// ============================================
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');
