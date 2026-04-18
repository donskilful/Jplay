import { YOUTUBE_API_KEY } from '../constants/config';
import type { Song } from '../types';

const BASE = 'https://www.googleapis.com/youtube/v3';

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

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
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
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10', // Music
    maxResults: String(limit),
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${BASE}/search?${params}`, signal ? { signal } : undefined);
  if (!res.ok) return [];
  const data = (await res.json()) as YouTubeSearchResponse;
  return (data.items ?? []).filter(item => Boolean(item.id?.videoId)).map(toSong);
}
