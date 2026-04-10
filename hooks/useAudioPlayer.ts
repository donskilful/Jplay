import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import type { Song, PlaybackState } from '../types';

export interface AudioPlayerReturn extends PlaybackState {
  play: (song: Song, index: number) => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
}

export function useAudioPlayer(songs: Song[]): AudioPlayerReturn {
  const soundRef = useRef<Audio.Sound | null>(null);
  // Use a ref for currentIndex inside callbacks to avoid stale closures
  const currentIndexRef = useRef<number>(0);
  const songsRef = useRef<Song[]>(songs);
  songsRef.current = songs;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [state, setState] = useState<PlaybackState>({
    currentSong: null,
    currentIndex: 0,
    isPlaying: false,
    position: 0,
    duration: 0,
    isLoading: false,
  });

  useEffect(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return () => {
      void soundRef.current?.unloadAsync();
    };
  }, []);

  // Stable callback ref — always calls the latest version, never goes stale
  const onStatusUpdateRef = useRef<(status: AVPlaybackStatus) => void>();
  // Incremented on every loadSong call — lets us cancel in-flight loads
  const loadIdRef = useRef<number>(0);

  const loadSong = useCallback(async (song: Song, index: number): Promise<void> => {
    // Each call gets a unique ID — only the latest one may proceed
    const thisLoadId = ++loadIdRef.current;

    setState(prev => ({ ...prev, isLoading: true, isPlaying: false }));

    // Stop playback immediately before unloading to prevent audio overlap
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Sound may already be in an unloaded state — safe to ignore
      }
      soundRef.current = null;
    }

    // A newer tap came in while we were stopping — bail out
    if (thisLoadId !== loadIdRef.current) return;

    const { sound } = await Audio.Sound.createAsync(
      { uri: song.uri },
      { shouldPlay: true },
      (status) => onStatusUpdateRef.current?.(status)
    );

    // A newer tap came in while we were fetching — discard this sound
    if (thisLoadId !== loadIdRef.current) {
      try { await sound.unloadAsync(); } catch { /* already gone */ }
      return;
    }

    soundRef.current = sound;
    currentIndexRef.current = index;
    setCurrentIndex(index);

    setState(prev => ({
      ...prev,
      currentSong: song,
      currentIndex: index,
      isPlaying: true,
      isLoading: false,
    }));
  }, []);

  const playNext = useCallback(async (): Promise<void> => {
    const list = songsRef.current;
    if (list.length === 0) return;
    const nextIndex = (currentIndexRef.current + 1) % list.length;
    const nextSong = list[nextIndex];
    if (!nextSong) return;
    await loadSong(nextSong, nextIndex);
  }, [loadSong]);

  const playPrev = useCallback(async (): Promise<void> => {
    const list = songsRef.current;
    if (list.length === 0) return;
    const prevIndex = (currentIndexRef.current - 1 + list.length) % list.length;
    const prevSong = list[prevIndex];
    if (!prevSong) return;
    await loadSong(prevSong, prevIndex);
  }, [loadSong]);

  // Assign the real handler to the ref after playNext/playPrev are defined
  onStatusUpdateRef.current = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) return;

    setState(prev => ({
      ...prev,
      position: status.positionMillis,
      duration: status.durationMillis ?? 0,
      isPlaying: status.isPlaying,
    }));

    if (status.didJustFinish) {
      void playNext();
    }
  };

  const play = useCallback(async (song: Song, index: number): Promise<void> => {
    await loadSong(song, index);
  }, [loadSong]);

  const pause = useCallback(async (): Promise<void> => {
    await soundRef.current?.pauseAsync();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, []);

  const seekTo = useCallback(async (positionMillis: number): Promise<void> => {
    await soundRef.current?.setPositionAsync(positionMillis);
  }, []);

  return {
    ...state,
    currentIndex,
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  };
}
