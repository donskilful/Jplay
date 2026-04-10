import type { Song } from '../types';

const BASE = 'https://api.deezer.com';

interface DeezerArtist {
  name: string;
  picture_medium: string;
}

interface DeezerAlbum {
  title: string;
  cover_medium: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
}

interface DeezerResponse {
  data: DeezerTrack[];
}

function toSong(t: DeezerTrack): Song {
  return {
    id: `deezer_${t.id}`,
    title: t.title ?? 'Unknown',
    artist: t.artist?.name ?? 'Unknown Artist',
    album: t.album?.title ?? 'Unknown Album',
    genre: 'Unknown',
    uri: t.preview,
    duration: (t.duration ?? 30) * 1000,
    artwork: t.album?.cover_medium,
    source: 'deezer',
  };
}

export async function getDeezerCharts(limit = 12, signal?: AbortSignal): Promise<Song[]> {
  const res = await fetch(`${BASE}/chart/0/tracks?limit=${limit}`, { signal });
  if (!res.ok) return [];
  const data = await res.json() as DeezerResponse;
  return (data.data ?? []).filter(t => Boolean(t.preview)).map(toSong);
}

export async function searchDeezer(query: string, limit = 10, signal?: AbortSignal): Promise<Song[]> {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as DeezerResponse;
  return (data.data ?? []).filter(t => Boolean(t.preview)).map(toSong);
}
