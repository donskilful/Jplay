export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  uri: string;
  duration?: number;
  artwork?: string;
  /** Where this song came from */
  source?: 'local' | 'youtube';
  /** YouTube video ID — only set when source === 'youtube' */
  youtubeVideoId?: string;
}

export interface PlaybackState {
  currentSong: Song | null;
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
}

export interface PlayerContextValue extends PlaybackState {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  recentlyPlayed: Song[];
  favorites: string[];
  favoriteSongs: Song[];
  toggleFavorite: (song: Song) => void;
  isFavorite: (id: string) => boolean;
  downloads: string[];
  addDownload: (id: string) => void;
  isDownloaded: (id: string) => boolean;
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
  /** YouTube-specific: whether the YouTube iframe should be playing */
  ytPlaying: boolean;
  setYtPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether the YouTube player is in audio-only mode (video hidden) */
  audioOnly: boolean;
  setAudioOnly: React.Dispatch<React.SetStateAction<boolean>>;
  /** YouTube playback position in seconds (polled from player) */
  ytPosition: number;
  setYtPosition: React.Dispatch<React.SetStateAction<number>>;
  /** YouTube track duration in seconds (polled from player) */
  ytDuration: number;
  setYtDuration: React.Dispatch<React.SetStateAction<number>>;
}
