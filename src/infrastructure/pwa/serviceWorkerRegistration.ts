/**
 * Service Worker Registration - Prompt 6.3
 * 
 * Handles service worker registration and update lifecycle
 */

export interface SWRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  config: SWRegistrationConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  // Only register in production
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping service worker registration in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content available, please refresh.');
            config.onUpdate?.(registration);
          } else {
            // Content cached for offline use
            console.log('[SW] Content cached for offline use.');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    console.log('[SW] Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[SW] Service worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if app is running as PWA (installed)
 */
export function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Subscribe to online/offline status changes
 */
export function subscribeToNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Request background sync (if supported)
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Cast needed for background sync API
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
    console.log('[SW] Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    return false;
  }
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(
  message: { type: string; payload?: unknown }
): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage(message);
}

/**
 * Force update the service worker
 */
export async function forceUpdateSW(): Promise<void> {
  await sendMessageToSW({ type: 'SKIP_WAITING' });
  window.location.reload();
}

/**
 * Clear all caches
 */
export async function clearCaches(): Promise<void> {
  await sendMessageToSW({ type: 'CLEAR_CACHE' });
}
