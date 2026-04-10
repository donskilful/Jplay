import { useCallback, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import type { Song } from '../types';

const SONGS_DIR = `${FileSystem.documentDirectory ?? ''}jplay_songs/`;

async function ensureSongsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SONGS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
  }
}

async function getDuration(uri: string): Promise<number | undefined> {
  try {
    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const dur = status.isLoaded ? (status.durationMillis ?? undefined) : undefined;
    await sound.unloadAsync();
    return dur;
  } catch {
    return undefined;
  }
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

function parseTitle(filename: string): { title: string; artist: string } {
  const base = stripExtension(filename);
  // Common "Artist - Title" pattern
  const dashIdx = base.indexOf(' - ');
  if (dashIdx !== -1) {
    return {
      artist: base.slice(0, dashIdx).trim(),
      title: base.slice(dashIdx + 3).trim(),
    };
  }
  return { title: base.trim(), artist: 'Unknown Artist' };
}

export function useImportSongs(onImported: (songs: Song[]) => void) {
  const [isImporting, setIsImporting] = useState(false);

  const importSongs = useCallback(async (): Promise<void> => {
    if (isImporting) return;
    setIsImporting(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      await ensureSongsDir();

      const imported: Song[] = [];

      for (const asset of result.assets) {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${asset.name}`;
        const dest = `${SONGS_DIR}${uniqueName}`;

        try {
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
        } catch {
          // If copy fails (e.g. file already in permanent storage), use original URI
        }

        const finalUri = (await FileSystem.getInfoAsync(dest)).exists ? dest : asset.uri;
        const { title, artist } = parseTitle(asset.name);
        const duration = await getDuration(finalUri);

        imported.push({
          id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          title,
          artist,
          album: 'Imported',
          genre: 'Unknown',
          uri: finalUri,
          duration,
        });
      }

      if (imported.length > 0) {
        onImported(imported);
      }
    } finally {
      setIsImporting(false);
    }
  }, [isImporting, onImported]);

  return { importSongs, isImporting };
}
