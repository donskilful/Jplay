import { JAMENDO_CLIENT_ID } from '../constants/config';
import type { Song } from '../types';

const BASE = 'https://api.jamendo.com/v3.0';

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  audio: string;
  image: string;
  duration: number;
  musicinfo?: {
    tags?: { genres?: string[] };
  };
}

interface JamendoResponse {
  headers: { status: string };
  results: JamendoTrack[];
}

function toSong(t: JamendoTrack): Song {
  return {
    id: `jamendo_${t.id}`,
    title: t.name ?? 'Unknown',
    artist: t.artist_name ?? 'Unknown Artist',
    album: t.album_name ?? 'Unknown Album',
    genre: t.musicinfo?.tags?.genres?.[0] ?? 'Unknown',
    uri: t.audio,
    duration: (t.duration ?? 0) * 1000,
    artwork: t.image,
    source: 'jamendo',
  };
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const base = `${BASE}${path}?client_id=${JAMENDO_CLIENT_ID}&format=json&audioformat=mp32&include=musicinfo`;
  const extra = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return extra ? `${base}&${extra}` : base;
}

export async function searchJamendo(query: string, limit = 20, signal?: AbortSignal): Promise<Song[]> {
  const url = buildUrl('/tracks/', { search: query, limit });
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as JamendoResponse;
  return data.results.filter(t => Boolean(t.audio)).map(toSong);
}

export async function getFeaturedJamendo(limit = 12, signal?: AbortSignal): Promise<Song[]> {
  const url = buildUrl('/tracks/', { order: 'popularity_total', limit });
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as JamendoResponse;
  return data.results.filter(t => Boolean(t.audio)).map(toSong);
}

export async function getJamendoByGenre(genre: string, limit = 12, signal?: AbortSignal): Promise<Song[]> {
  const url = buildUrl('/tracks/', { tags: genre, order: 'popularity_total', limit });
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as JamendoResponse;
  return data.results.filter(t => Boolean(t.audio)).map(toSong);
}
