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
  source?: 'local' | 'archive' | 'jamendo';
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
}
