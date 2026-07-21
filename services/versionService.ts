declare const __APP_VERSION__: string;

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_RETRY_DELAY_MS = 30 * 1000;
const RELOAD_GUARD_KEY = 'family-points-version-reload';
const SERVICE_WORKER_PATH = `${import.meta.env.BASE_URL}sw.js`;
const REMOTE_VERSION_MANIFEST_URL = 'https://raw.githubusercontent.com/rushbq/Familypoints-Pages/gh-pages/version.json';

interface VersionManifest {
  version: string;
}

const withCacheBuster = (source: string) => {
  const versionUrl = new URL(source, window.location.origin);
  versionUrl.searchParams.set('t', Date.now().toString());
  return versionUrl.toString();
};

const fetchVersionManifest = async () => {
  const sources = [
    REMOTE_VERSION_MANIFEST_URL,
    `${import.meta.env.BASE_URL}version.json`,
  ];

  for (const source of sources) {
    try {
      const response = await fetch(withCacheBuster(source), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) continue;

      const manifest = await response.json() as VersionManifest;
      if (manifest.version) return manifest;
    } catch {
      // GitHub raw 暫時無法連線時，繼續嘗試同網域的備援版本檔。
    }
  }

  return null;
};

const removeAppVersionParameter = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('appVersion')) return;

  url.searchParams.delete('appVersion');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
};

const clearSiteRuntimeCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  }
};

const registerUpdateServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    await registration.update();
  } catch (error) {
    console.warn('暫時無法啟用自動更新服務，稍後會再次嘗試。', error);
  }
};

const reloadForVersion = async (nextVersion: string) => {
  const guardValue = sessionStorage.getItem(RELOAD_GUARD_KEY);
  if (guardValue) {
    try {
      const guard = JSON.parse(guardValue) as { version: string; attemptedAt: number };
      if (guard.version === nextVersion && Date.now() - guard.attemptedAt < RELOAD_RETRY_DELAY_MS) {
        return;
      }
    } catch {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
    }
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify({
    version: nextVersion,
    attemptedAt: Date.now(),
  }));
  await clearSiteRuntimeCaches();

  const url = new URL(window.location.href);
  url.searchParams.set('appVersion', nextVersion);
  window.location.replace(url.toString());
};

const checkForNewVersion = async () => {
  if (document.visibilityState === 'hidden') return;

  try {
    const manifest = await fetchVersionManifest();
    if (!manifest) return;

    if (manifest.version !== __APP_VERSION__) {
      await reloadForVersion(manifest.version);
      return;
    }

    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    removeAppVersionParameter();
  } catch (error) {
    console.warn('暫時無法檢查應用程式版本，稍後會自動重試。', error);
  }
};

export const startVersionMonitor = () => {
  if (import.meta.env.DEV || typeof window === 'undefined') return;

  void registerUpdateServiceWorker();

  const initialCheckTimer = window.setTimeout(checkForNewVersion, 1500);
  const interval = window.setInterval(checkForNewVersion, VERSION_CHECK_INTERVAL_MS);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') void checkForNewVersion();
  };
  const handlePageShow = () => void checkForNewVersion();
  const handleControllerChange = () => void checkForNewVersion();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

  return () => {
    window.clearTimeout(initialCheckTimer);
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
    navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
  };
};
