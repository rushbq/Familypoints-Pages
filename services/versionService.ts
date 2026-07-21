declare const __APP_VERSION__: string;

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_RETRY_DELAY_MS = 30 * 1000;
const RELOAD_GUARD_KEY = 'family-points-version-reload';

interface VersionManifest {
  version: string;
}

const getVersionUrl = () => {
  const versionUrl = new URL(`${import.meta.env.BASE_URL}version.json`, window.location.origin);
  versionUrl.searchParams.set('t', Date.now().toString());
  return versionUrl.toString();
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

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
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
    const response = await fetch(getVersionUrl(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return;

    const manifest = await response.json() as VersionManifest;
    if (!manifest.version) return;

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

  const initialCheckTimer = window.setTimeout(checkForNewVersion, 1500);
  const interval = window.setInterval(checkForNewVersion, VERSION_CHECK_INTERVAL_MS);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') void checkForNewVersion();
  };
  const handlePageShow = () => void checkForNewVersion();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);

  return () => {
    window.clearTimeout(initialCheckTimer);
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
  };
};
