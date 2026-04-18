import { BACKEND_URL } from '../constants/config';
import type { Song } from '../types';

interface YouTubeSnippet {
  title: string;
  channelTitle: string;
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: YouTubeSnippet;
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toSong(item: YouTubeSearchItem): Song {
  const thumb =
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url;

  const song: Song = {
    id: `youtube_${item.id.videoId}`,
    title: decodeHtml(item.snippet.title),
    artist: item.snippet.channelTitle,
    album: 'YouTube',
    genre: 'YouTube',
    uri: item.id.videoId,
    source: 'stream',
    youtubeVideoId: item.id.videoId,
  };
  if (thumb) song.artwork = thumb;
  return song;
}

export async function searchYouTube(
  query: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<Song[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${BACKEND_URL}/search?${params}`, signal ? { signal } : undefined);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: YouTubeSearchItem[] };
  return (data.items ?? []).filter(item => Boolean(item.id?.videoId)).map(toSong);
}
