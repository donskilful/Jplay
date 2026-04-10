import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song, PlayerContextValue } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const STORAGE_KEYS = {
  favorites: '@jplay/favorites',
  favoriteSongs: '@jplay/favoriteSongs',
  songs: '@jplay/songs',
  recentlyPlayed: '@jplay/recentlyPlayed',
} as const;

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage write failure — non-fatal
  }
}


const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

interface PlayerProviderProps {
  children: React.ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps): React.JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted data on first mount
  useEffect(() => {
    void (async () => {
      const [savedFavorites, savedFavSongs, savedSongs, savedRecent] = await Promise.all([
        load<string[]>(STORAGE_KEYS.favorites, []),
        load<Song[]>(STORAGE_KEYS.favoriteSongs, []),
        load<Song[]>(STORAGE_KEYS.songs, []),
        load<Song[]>(STORAGE_KEYS.recentlyPlayed, []),
      ]);
      setFavorites(savedFavorites);
      setFavoriteSongs(savedFavSongs);
      setSongs(savedSongs.filter(s => s.source === 'local' || s.source === undefined));
      setRecentlyPlayed(savedRecent);
      setHydrated(true);
    })();
  }, []);

  // Persist whenever state changes (after hydration to avoid overwriting with defaults)
  useEffect(() => {
    if (!hydrated) return;
    void save(STORAGE_KEYS.favorites, favorites);
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void save(STORAGE_KEYS.favoriteSongs, favoriteSongs);
  }, [favoriteSongs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Only save local imported songs, not streamed ones
    void save(STORAGE_KEYS.songs, songs.filter(s => s.source === 'local' || s.source === undefined));
  }, [songs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void save(STORAGE_KEYS.recentlyPlayed, recentlyPlayed);
  }, [recentlyPlayed, hydrated]);

  const player = useAudioPlayer(songs);
  const { play: playerPlay } = player;

  const toggleFavorite = useCallback((song: Song): void => {
    setFavorites(prev => {
      if (prev.includes(song.id)) {
        setFavoriteSongs(s => s.filter(fs => fs.id !== song.id));
        return prev.filter(id => id !== song.id);
      } else {
        setFavoriteSongs(s => s.some(fs => fs.id === song.id) ? s : [...s, song]);
        return [...prev, song.id];
      }
    });
  }, []);

  const isFavorite = useCallback((id: string): boolean => {
    return favorites.includes(id);
  }, [favorites]);

  const addDownload = useCallback((id: string): void => {
    setDownloads(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const isDownloaded = useCallback((id: string): boolean => {
    return downloads.includes(id);
  }, [downloads]);

  const wrappedPlay = useCallback(async (song: Song, index: number): Promise<void> => {
    await playerPlay(song, index);
    setRecentlyPlayed(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 10));
  }, [playerPlay]);

  const value: PlayerContextValue = {
    songs,
    setSongs,
    recentlyPlayed,
    favorites,
    favoriteSongs,
    toggleFavorite,
    isFavorite,
    downloads,
    addDownload,
    isDownloaded,
    ...player,
    play: wrappedPlay,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}
