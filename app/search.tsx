import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity, Share, ActivityIndicator, SectionList,
} from 'react-native';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SongCard from '../components/SongCard';
import OptionsModal from '../components/OptionsModal';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { searchYouTube } from '../services/youtubeAPI';
import type { Song } from '../types';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';
import type { Ionicons as IoniconsType } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof IoniconsType>['name'];

interface ResultSection {
  title: string;
  subtitle: string;
  data: Song[];
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.textPrimary, fontSize: FONT.xl, fontFamily: 'Outfit_700Bold' },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: RADIUS.md, marginHorizontal: 16, marginBottom: 16,
      paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    searchIcon: { marginRight: 8 },
    input: { flex: 1, color: colors.textPrimary, fontSize: FONT.md },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'baseline', gap: 8,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
      backgroundColor: colors.bg,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '700' },
    sectionSubtitle: { color: colors.textMuted, fontSize: FONT.xs },
    listFooter: { height: 100 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyTitle: { color: colors.textPrimary, fontSize: FONT.lg, fontWeight: '600' },
    emptySubtitle: { color: colors.textSecondary, fontSize: FONT.md, textAlign: 'center' },
    loadingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 16,
    },
    loadingText: { color: colors.textSecondary, fontSize: FONT.sm },
    noResults: {
      paddingHorizontal: 20, paddingVertical: 12,
      color: colors.textMuted, fontSize: FONT.sm, fontStyle: 'italic',
    },
  });
}

const DEBOUNCE_MS = 400;

export default function SearchScreen(): React.JSX.Element {
  const { songs, setSongs, currentSong, isPlaying, play, toggleFavorite, isFavorite } = usePlayerContext();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<Song[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playStreamed = useCallback(async (song: Song): Promise<void> => {
    const allResults = [...localResults, ...youtubeResults];
    const toAdd = allResults.filter(r => !songs.some(s => s.id === r.id));
    const updatedSongs = toAdd.length > 0 ? [...songs, ...toAdd] : songs;
    if (toAdd.length > 0) setSongs(updatedSongs);
    const index = updatedSongs.findIndex(s => s.id === song.id);
    await play(song, index >= 0 ? index : 0);
    // YouTube songs are played via the iframe in the player screen.
    // Without navigating there the iframe stays 1×1 px and iOS blocks autoplay.
    if (song.source === 'youtube') {
      router.push('/player');
    }
  }, [songs, setSongs, play, localResults, youtubeResults]);

  useEffect(() => {
    const q = query.trim();

    // Local search is instant
    if (!q) {
      setLocalResults([]);
      setYoutubeResults([]);
      setIsSearching(false);
      return;
    }

    const lower = q.toLowerCase();
    const local = songs.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.artist.toLowerCase().includes(lower) ||
      s.album.toLowerCase().includes(lower) ||
      s.genre.toLowerCase().includes(lower)
    );
    setLocalResults(local);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const youtube = await searchYouTube(q, 15, controller.signal);
          if (!controller.signal.aborted) {
            setYoutubeResults(youtube);
          }
        } catch {
          // AbortError or network error — ignore
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const sections = useMemo((): ResultSection[] => {
    const result: ResultSection[] = [];
    if (localResults.length > 0) {
      result.push({ title: 'In Your Library', subtitle: `${localResults.length} found`, data: localResults });
    }
    if (youtubeResults.length > 0) {
      result.push({ title: 'YouTube', subtitle: 'Full tracks · Video + Audio', data: youtubeResults });
    }
    return result;
  }, [localResults, youtubeResults]);

  const hasResults = sections.length > 0;
  const isTyping = query.trim().length > 0;

  const buildOptions = (song: Song): { icon: IoniconsName; label: string; onPress: () => void; destructive?: boolean }[] => [
    {
      icon: 'heart' as IoniconsName,
      label: isFavorite(song.id) ? 'Remove from Favorites' : 'Add to Favorites',
      onPress: () => toggleFavorite(song),
    },
    {
      icon: 'play-circle' as IoniconsName,
      label: 'Play Now',
      onPress: () => void playStreamed(song),
    },
    {
      icon: 'share-social' as IoniconsName,
      label: 'Share',
      onPress: () => {
        void Share.share({
          title: song.title,
          message: `🎵 "${song.title}" by ${song.artist}\nAlbum: ${song.album} · ${song.genre}\n\nListening on JPlay`,
        });
      },
    },
  ];

  const renderItem = ({ item }: SectionListRenderItemInfo<Song, ResultSection>): React.JSX.Element => (
    <SongCard
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={isPlaying && currentSong?.id === item.id}
      onPress={() => void playStreamed(item)}
      onOptions={() => setSelectedSong(item)}
    />
  );

  const renderSectionHeader = ({ section }: { section: SectionListData<Song, ResultSection> }): React.JSX.Element => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Songs, artists, albums..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {isSearching && <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 4 }} />}
        {!isSearching && query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!isTyping ? (
        <View style={styles.empty}>
          <Ionicons name="search" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Search everything</Text>
          <Text style={styles.emptySubtitle}>
            Search your library and YouTube all at once
          </Text>
        </View>
      ) : !hasResults && !isSearching ? (
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>Nothing found for "{query}"</Text>
        </View>
      ) : (
        <SectionList<Song, ResultSection>
          sections={sections}
          keyExtractor={(item: Song) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}

      {selectedSong !== null && (
        <OptionsModal
          visible={selectedSong !== null}
          title={selectedSong.title}
          subtitle={`${selectedSong.artist} · ${selectedSong.album}`}
          options={buildOptions(selectedSong)}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </SafeAreaView>
  );
}
