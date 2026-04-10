import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import UpNextItem from '../components/UpNextItem';
import QueueModal from '../components/QueueModal';
import OptionsModal from '../components/OptionsModal';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 64;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function makeStyles(colors: ThemeColors, accentColor: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingBottom: 40 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyArtwork: {
      width: 120, height: 120, borderRadius: RADIUS.xl,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { color: colors.textPrimary, fontSize: FONT.xl, fontWeight: '700' },
    emptySubtitle: { color: colors.textSecondary, fontSize: FONT.md, textAlign: 'center' },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '600', letterSpacing: 0.5 },
    artworkContainer: {
      alignSelf: 'center', marginBottom: 28,
      shadowColor: accentColor, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
    },
    artwork: { width: ARTWORK_SIZE, height: ARTWORK_SIZE, borderRadius: RADIUS.lg },
    artworkPlaceholder: {
      width: ARTWORK_SIZE, height: ARTWORK_SIZE, borderRadius: RADIUS.lg,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20, gap: 12 },
    infoText: { flex: 1 },
    songTitle: { color: colors.textPrimary, fontSize: FONT.lg, fontWeight: '700', letterSpacing: 0.2 },
    artistName: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 4 },
    genreTag: {
      color: accentColor, fontSize: FONT.xs, marginTop: 4,
      fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    infoActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    progressContainer: { paddingHorizontal: 16, marginBottom: 8 },
    slider: { width: '100%', height: 36 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4, paddingHorizontal: 4 },
    time: { color: colors.textSecondary, fontSize: FONT.xs },
    controls: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 28, marginVertical: 20,
    },
    controlBtn: { padding: 8 },
    playBtn: {
      width: 68, height: 68, borderRadius: RADIUS.full, backgroundColor: accentColor,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: accentColor, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
    },
    activeDot: {
      width: 4, height: 4, borderRadius: 2, backgroundColor: accentColor,
      alignSelf: 'center', marginTop: 3,
    },
    upNext: {
      marginHorizontal: 20, marginTop: 8, backgroundColor: colors.surface,
      borderRadius: RADIUS.lg, padding: 16,
    },
    upNextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    upNextTitle: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '700' },
    viewAll: { color: accentColor, fontSize: FONT.sm, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 8 },
  });
}

export default function PlayerScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const {
    songs,
    setSongs,
    currentSong,
    currentIndex,
    isPlaying,
    isLoading,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    play,
    toggleFavorite,
    isFavorite,
    addDownload,
    isDownloaded,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerContext();

  const styles = React.useMemo(() => makeStyles(colors, colors.accent), [colors]);

  const [showQueue, setShowQueue] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const upNext = songs.slice(currentIndex + 1);
  const liked = currentSong ? isFavorite(currentSong.id) : false;
  const downloaded = currentSong ? isDownloaded(currentSong.id) : false;

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async (): Promise<void> => {
    if (!currentSong) return;
    await Share.share({
      title: currentSong.title,
      message: `🎵 "${currentSong.title}" by ${currentSong.artist}\nAlbum: ${currentSong.album} · ${currentSong.genre}\n\nListening on JPlay`,
    });
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async (): Promise<void> => {
    if (!currentSong || downloaded || isDownloading) return;

    setIsDownloading(true);
    try {
      const dir = `${FileSystem.documentDirectory ?? ''}jplay_songs/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const safeTitle = currentSong.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${currentSong.id}_${safeTitle}.mp3`;
      const dest = `${dir}${filename}`;

      // Check if already downloaded on disk
      const info = await FileSystem.getInfoAsync(dest);
      const localUri = info.exists ? dest : await (async () => {
        const dl = FileSystem.createDownloadResumable(currentSong.uri, dest);
        const result = await dl.downloadAsync();
        return result?.uri ?? dest;
      })();

      // Update the song in the library to use the local file URI
      setSongs(prev => prev.map(s =>
        s.id === currentSong.id
          ? { ...s, uri: localUri, source: 'local' as const }
          : s
      ));

      // Also add any streamed song that wasn't in library yet
      setSongs(prev =>
        prev.some(s => s.id === currentSong.id)
          ? prev
          : [...prev, { ...currentSong, uri: localUri, source: 'local' as const }]
      );

      addDownload(currentSong.id);
      Alert.alert('Saved to Library', `"${currentSong.title}" is now in your library and plays offline.`);
    } catch {
      Alert.alert('Download Failed', 'Could not download the track. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Options items ──────────────────────────────────────────────────────────
  const optionItems = [
    {
      icon: 'musical-notes' as IoniconsName,
      label: 'Go to Album',
      onPress: (): void => { /* future: navigate to album */ },
    },
    {
      icon: 'person' as IoniconsName,
      label: 'Go to Artist',
      onPress: (): void => { /* future: navigate to artist */ },
    },
    {
      icon: 'list' as IoniconsName,
      label: 'Add to Playlist',
      onPress: (): void => { /* future: show playlist picker */ },
    },
    {
      icon: 'share-social' as IoniconsName,
      label: 'Share Song',
      onPress: (): void => { void handleShare(); },
    },
    {
      icon: 'flag' as IoniconsName,
      label: 'Report',
      onPress: (): void => { /* future: report flow */ },
      destructive: true,
    },
  ];

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <View style={styles.emptyArtwork}>
            <Ionicons name="musical-notes" size={56} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Nothing playing</Text>
          <Text style={styles.emptySubtitle}>Go to Library and pick a song</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/')}
            accessibilityLabel="Go to Library"
          >
            <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Playing</Text>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowOptions(true)}
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Album Artwork ── */}
        <View style={styles.artworkContainer}>
          {currentSong.artwork ? (
            <Image
              source={{ uri: currentSong.artwork }}
              style={styles.artwork}
              accessibilityLabel={`Album art for ${currentSong.title}`}
            />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Ionicons name="musical-note" size={80} color={colors.accent} />
            </View>
          )}
        </View>

        {/* ── Song Info + Actions ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.artistName} numberOfLines={1}>{currentSong.artist}</Text>
            <Text style={styles.genreTag} numberOfLines={1}>{currentSong.genre}</Text>
          </View>
          <View style={styles.infoActions}>
            {/* Share */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => void handleShare()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Share song"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Download */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => void handleDownload()}
              disabled={downloaded || isDownloading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={downloaded ? 'Downloaded' : 'Download song'}
            >
              <Ionicons
                name={
                  (downloaded
                    ? 'checkmark-circle'
                    : isDownloading
                    ? 'hourglass'
                    : 'arrow-down-circle-outline') as IoniconsName
                }
                size={20}
                color={downloaded ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleFavorite(currentSong)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={liked ? 'Unlike song' : 'Like song'}
            >
              <Ionicons
                name={(liked ? 'heart' : 'heart-outline') as IoniconsName}
                size={20}
                color={liked ? colors.danger : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Progress Bar ── */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
            accessibilityLabel="Song progress"
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={`Repeat: ${repeatMode}`}
          >
            <Ionicons
              name={'repeat' as IoniconsName}
              size={22}
              color={repeatMode !== 'off' ? colors.accent : colors.textSecondary}
            />
            {repeatMode === 'one' && (
              <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 1 }}>1</Text>
            )}
            {repeatMode === 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playPrev}
            style={styles.controlBtn}
            accessibilityLabel="Previous song"
          >
            <Ionicons name="play-skip-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={styles.playBtn}
            disabled={isLoading}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            <Ionicons
              name={(isLoading ? 'hourglass' : isPlaying ? 'pause' : 'play') as IoniconsName}
              size={32}
              color={colors.bg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playNext}
            style={styles.controlBtn}
            accessibilityLabel="Next song"
          >
            <Ionicons name="play-skip-forward" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleShuffle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Ionicons
              name={'shuffle' as IoniconsName}
              size={22}
              color={isShuffle ? colors.accent : colors.textSecondary}
            />
            {isShuffle && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* ── Up Next ── */}
        {upNext.length > 0 && (
          <View style={styles.upNext}>
            <View style={styles.upNextHeader}>
              <Text style={styles.upNextTitle}>Up next</Text>
              <TouchableOpacity onPress={() => setShowQueue(true)}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            {upNext.slice(0, 4).map((song, i) => (
              <UpNextItem
                key={song.id}
                song={song}
                isActive={false}
                isLiked={isFavorite(song.id)}
                onPress={() => void play(song, currentIndex + 1 + i)}
                onFavorite={() => toggleFavorite(song)}
                onOptions={() => setShowOptions(true)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Queue Modal ── */}
      <QueueModal
        visible={showQueue}
        queue={upNext}
        currentSong={currentSong}
        queueStartIndex={currentIndex + 1}
        onClose={() => setShowQueue(false)}
        onSelectSong={(song, index) => {
          setShowQueue(false);
          void play(song, index);
        }}
      />

      {/* ── Options Modal ── */}
      <OptionsModal
        visible={showOptions}
        title={currentSong.title}
        subtitle={`${currentSong.artist} · ${currentSong.album}`}
        options={optionItems}
        onClose={() => setShowOptions(false)}
      />
    </SafeAreaView>
  );
}

