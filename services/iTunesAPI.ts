import { ITUNES_BASE } from '../constants/config';
import type { Song } from '../types';

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  primaryGenreName: string;
  previewUrl: string;
  trackTimeMillis: number;
  artworkUrl100: string;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesTrack[];
}

function toSong(t: ItunesTrack): Song {
  return {
    id: `itunes_${t.trackId}`,
    title: t.trackName ?? 'Unknown',
    artist: t.artistName ?? 'Unknown Artist',
    album: t.collectionName ?? 'Unknown Album',
    genre: t.primaryGenreName ?? 'Unknown',
    uri: t.previewUrl,
    duration: t.trackTimeMillis ?? 30000,
    artwork: t.artworkUrl100?.replace('100x100bb', '300x300bb'),
    source: 'itunes',
  };
}

export async function searchItunes(query: string, limit = 20, signal?: AbortSignal): Promise<Song[]> {
  const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as ItunesResponse;
  return data.results.filter(t => Boolean(t.previewUrl)).map(toSong);
}

export async function getItunesCharts(limit = 10, signal?: AbortSignal): Promise<Song[]> {
  // Top songs via iTunes RSS → search popular terms as a fallback
  const url = `${ITUNES_BASE}/search?term=top+hits+2024&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json() as ItunesResponse;
  return data.results.filter(t => Boolean(t.previewUrl)).map(toSong);
}
