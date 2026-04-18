import { BACKEND_URL } from '../constants/config';

export interface StreamInfo {
  url: string;
  expiresAt: number;
  duration: number;
  title: string;
  thumbnail: string;
}

// Module-level cache — survives re-renders, clears on app restart
const streamCache = new Map<string, StreamInfo>();

function isFresh(info: StreamInfo): boolean {
  // Consider stale if within 2 minutes of expiry
  return info.expiresAt > Math.floor(Date.now() / 1000) + 120;
}

export async function getStreamUrl(
  videoId: string,
  signal?: AbortSignal,
): Promise<StreamInfo> {
  const cached = streamCache.get(videoId);
  if (cached && isFresh(cached)) return cached;

  const res = await fetch(`${BACKEND_URL}/stream/${videoId}`, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`Stream fetch failed: ${res.status}`);

  const info = (await res.json()) as StreamInfo;
  streamCache.set(videoId, info);
  return info;
}

export function getAudioDownloadUrl(videoId: string): string {
  return `${BACKEND_URL}/download/audio/${videoId}`;
}

export function getVideoDownloadUrl(videoId: string): string {
  return `${BACKEND_URL}/download/video/${videoId}`;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
