import { useState, useEffect, useRef, useCallback } from 'react';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { Song, PlaybackState } from '../types';
import { getStreamUrl } from '../services/streamAPI';

export interface AudioPlayerReturn extends PlaybackState {
  play: (song: Song, index: number) => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

let playerReady = false;

async function ensurePlayer(): Promise<void> {
  if (playerReady) return;
  await TrackPlayer.setupPlayer({
    autoHandleInterruptions: true,
  });
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
      Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    progressUpdateEventInterval: 1,
  });
  playerReady = true;
}

export function useAudioPlayer(songs: Song[]): AudioPlayerReturn {
  const songsRef = useRef<Song[]>(songs);
  songsRef.current = songs;

  const currentIndexRef = useRef<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const isShuffleRef = useRef(false);
  const repeatModeRef = useRef<'off' | 'all' | 'one'>('off');
  isShuffleRef.current = isShuffle;
  repeatModeRef.current = repeatMode;
  const [isLoading, setIsLoading] = useState(false);
  const loadIdRef = useRef(0);
  const isLoadingRef = useRef(false);

  const playbackState = usePlaybackState();
  const progress = useProgress(500);

  const isPlaying = playbackState.state === State.Playing;
  const isNativeBuffering =
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading;
  const position = progress.position * 1000;
  const duration = progress.duration * 1000;

  useEffect(() => {
    void ensurePlayer();
  }, []);

  const loadSong = useCallback(async (song: Song, index: number): Promise<void> => {
    const thisLoadId = ++loadIdRef.current;
    isLoadingRef.current = true;
    setIsLoading(true);
    // Show song info immediately so the player screen has content while loading
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setCurrentSong(song);

    try {
      let resolvedSong = song;
      if (song.source === 'stream' && song.youtubeVideoId) {
        const info = await getStreamUrl(song.youtubeVideoId);
        if (thisLoadId !== loadIdRef.current) return;
        resolvedSong = {
          ...song,
          uri: info.url,
          duration: song.duration ?? info.duration * 1000,
          artwork: song.artwork ?? info.thumbnail,
        };
      }

      if (thisLoadId !== loadIdRef.current) return;

      await TrackPlayer.reset();
      const track = {
        id: resolvedSong.id,
        url: resolvedSong.uri,
        title: resolvedSong.title,
        artist: resolvedSong.artist ?? '',
        album: resolvedSong.album ?? '',
        ...(resolvedSong.artwork ? { artwork: resolvedSong.artwork } : {}),
        ...(resolvedSong.duration ? { duration: resolvedSong.duration / 1000 } : {}),
      };
      await TrackPlayer.add(track);
      await TrackPlayer.play();
      setCurrentSong(resolvedSong);
    } finally {
      if (thisLoadId === loadIdRef.current) {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, []);

  const playNext = useCallback(async (): Promise<void> => {
    const list = songsRef.current;
    if (list.length === 0) return;
    if (repeatModeRef.current === 'one') {
      const cur = list[currentIndexRef.current];
      if (cur) { await loadSong(cur, currentIndexRef.current); return; }
    }
    let nextIndex: number;
    if (isShuffleRef.current && list.length > 1) {
      do { nextIndex = Math.floor(Math.random() * list.length); }
      while (nextIndex === currentIndexRef.current);
    } else {
      nextIndex = (currentIndexRef.current + 1) % list.length;
    }
    if (repeatModeRef.current === 'off' && nextIndex === 0 && !isShuffleRef.current) return;
    const next = list[nextIndex];
    if (next) await loadSong(next, nextIndex);
  }, [loadSong]);

  const playPrev = useCallback(async (): Promise<void> => {
    const list = songsRef.current;
    if (list.length === 0) return;
    if (repeatModeRef.current === 'one') {
      const cur = list[currentIndexRef.current];
      if (cur) { await loadSong(cur, currentIndexRef.current); return; }
    }
    let prevIndex: number;
    if (isShuffleRef.current && list.length > 1) {
      do { prevIndex = Math.floor(Math.random() * list.length); }
      while (prevIndex === currentIndexRef.current);
    } else {
      prevIndex = (currentIndexRef.current - 1 + list.length) % list.length;
    }
    const prev = list[prevIndex];
    if (prev) await loadSong(prev, prevIndex);
  }, [loadSong]);

  // Auto-advance when track ends — skip if a user-initiated load is already in progress
  useTrackPlayerEvents([Event.PlaybackQueueEnded], () => {
    if (!isLoadingRef.current) void playNext();
  });

  // Sync repeat mode with TrackPlayer
  useEffect(() => {
    const rnMode = repeatMode === 'one' ? RepeatMode.Track : RepeatMode.Off;
    void TrackPlayer.setRepeatMode(rnMode);
  }, [repeatMode]);

  const play = useCallback(async (song: Song, index: number): Promise<void> => {
    await loadSong(song, index);
  }, [loadSong]);

  const pause = useCallback(async (): Promise<void> => {
    await TrackPlayer.pause();
  }, []);

  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const seekTo = useCallback(async (positionMillis: number): Promise<void> => {
    await TrackPlayer.seekTo(positionMillis / 1000);
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  }, []);

  return {
    currentSong,
    currentIndex,
    isPlaying,
    position,
    duration,
    isLoading: isLoading || isNativeBuffering,
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  };
}
