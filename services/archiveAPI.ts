import type { Song } from '../types';

const SEARCH_BASE = 'https://archive.org/advancedsearch.php';
const META_BASE = 'https://archive.org/metadata';
const DL_BASE = 'https://archive.org/download';

// Curated FMA collections on archive.org — varied genres, full tracks
const FEATURED_QUERY = 'collection:freemusicarchive+mediatype:audio';

interface SearchDoc {
  identifier: string;
  title?: string;
  creator?: string;
  subject?: string | string[];
}

interface ArchiveFile {
  name: string;
  title?: string;
  length?: string;
  format?: string;
}

interface ArchiveMeta {
  metadata: {
    title?: string;
    creator?: string;
    subject?: string | string[];
  };
  files: ArchiveFile[];
}

function parseGenre(subject?: string | string[]): string {
  if (!subject) return 'Unknown';
  const s = Array.isArray(subject) ? subject[0] : subject;
  return s ?? 'Unknown';
}

function parseName(filename: string): string {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/_/g, ' ')
    .replace(/^[^-]+-\s*\d*\s*/, '') // strip "Artist - 01 " prefix
    .trim() || filename;
}

async function resolveItem(doc: SearchDoc, signal?: AbortSignal): Promise<Song[]> {
  try {
    const res = await fetch(`${META_BASE}/${doc.identifier}`, { signal });
    if (!res.ok) return [];
    const data = await res.json() as ArchiveMeta;
    const meta = data.metadata ?? {};
    const artist = meta.creator ?? doc.creator ?? 'Unknown Artist';
    const album = meta.title ?? doc.title ?? 'Unknown Album';
    const genre = parseGenre(meta.subject ?? doc.subject);

    const mp3s = (data.files ?? []).filter(
      f => typeof f === 'object' && f.name?.toLowerCase().endsWith('.mp3')
        && !f.name.startsWith('_') // skip archive-generated files
    );

    return mp3s.slice(0, 3).map(f => ({
      id: `archive_${doc.identifier}_${f.name}`,
      title: f.title ? f.title : parseName(f.name),
      artist,
      album,
      genre,
      uri: `${DL_BASE}/${doc.identifier}/${encodeURIComponent(f.name)}`,
      duration: f.length ? Math.round(parseFloat(f.length) * 1000) : undefined,
      artwork: `https://archive.org/services/img/${doc.identifier}`,
      source: 'archive' as const,
    }));
  } catch {
    return [];
  }
}

async function searchItems(query: string, rows: number, signal?: AbortSignal): Promise<SearchDoc[]> {
  const params = new URLSearchParams({
    q: query,
    'fl[]': 'identifier,title,creator,subject',
    'sort[]': 'downloads desc',
    output: 'json',
    rows: String(rows),
  });
  const res = await fetch(`${SEARCH_BASE}?${params}`, { signal });
  if (!res.ok) return [];
  const data = await res.json() as { response: { docs: SearchDoc[] } };
  return data.response?.docs ?? [];
}

export async function getFeaturedArchiveTracks(limit = 12, signal?: AbortSignal): Promise<Song[]> {
  const docs = await searchItems(FEATURED_QUERY, 10, signal);
  const results = await Promise.all(docs.map(d => resolveItem(d, signal)));
  return results.flat().slice(0, limit);
}

export async function searchArchive(query: string, limit = 10, signal?: AbortSignal): Promise<Song[]> {
  const q = `${query}+mediatype:audio+format:MP3`;
  const docs = await searchItems(q, 8, signal);
  const results = await Promise.all(docs.map(d => resolveItem(d, signal)));
  return results.flat().slice(0, limit);
}
