export type AnalyticsPayload = Record<string, any>;

export interface AnalyticsEventRecord {
  event: string;
  payload: AnalyticsPayload;
  timestamp: string;
  route: string;
  platform: string;
  userId: string | number | null;
}

const STORAGE_KEY = 'analytics_events';
const MAX_EVENTS = 200;

function getCurrentRoute(): string {
  try {
    const pages = getCurrentPages?.() as Array<{ route?: string }> | undefined;
    if (pages && pages.length > 0) {
      return pages[pages.length - 1]?.route || 'unknown';
    }
  } catch (error) {
  }
  return 'unknown';
}

function getPlatform(): string {
  const systemInfo = uni.getSystemInfoSync?.();
  return systemInfo?.uniPlatform || systemInfo?.platform || 'unknown';
}

function sanitizePayload(payload: AnalyticsPayload = {}): AnalyticsPayload {
  return Object.keys(payload).reduce((acc, key) => {
    const value = payload[key];
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as AnalyticsPayload);
}

function persistEvent(record: AnalyticsEventRecord): void {
  try {
    const current = uni.getStorageSync(STORAGE_KEY);
    const parsed = Array.isArray(current) ? current : (typeof current === 'string' && current ? JSON.parse(current) : []);
    const next = [...parsed, record].slice(-MAX_EVENTS);
    uni.setStorageSync(STORAGE_KEY, next);
  } catch (error) {
    console.warn('[analytics] persist failed', error);
  }
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}): void {
  const record: AnalyticsEventRecord = {
    event,
    payload: sanitizePayload(payload),
    timestamp: new Date().toISOString(),
    route: getCurrentRoute(),
    platform: getPlatform(),
    userId: uni.getStorageSync('userid') || null
  };

  persistEvent(record);
  console.log('[analytics]', record);
}

export function getTrackedEvents(): AnalyticsEventRecord[] {
  try {
    const current = uni.getStorageSync(STORAGE_KEY);
    if (Array.isArray(current)) {
      return current;
    }
    if (typeof current === 'string' && current) {
      return JSON.parse(current);
    }
  } catch (error) {
    console.warn('[analytics] read failed', error);
  }
  return [];
}

export function clearTrackedEvents(): void {
  uni.removeStorageSync(STORAGE_KEY);
}
