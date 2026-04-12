import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  ScrollView, Text, StyleSheet, SafeAreaView,
  View, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SongCardHorizontal from '../components/SongCardHorizontal';
import ArtistCard from '../components/ArtistCard';
import HorizontalScroller from '../components/HorizontalScroller';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useImportSongs } from '../hooks/useImportSongs';
import { searchYouTube } from '../services/youtubeAPI';
import type { Song } from '../types';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface Artist { name: string; artwork: string | undefined; songCount: number }

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingBottom: 100 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    headerLeft: { flex: 1 },
    appName: {
      color: colors.textPrimary,
      fontSize: FONT.xxl,
      fontFamily: 'Outfit_700Bold',
      letterSpacing: 0.5,
    },
    headerSub: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 2 },
    importBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.accent, borderRadius: RADIUS.md,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    importBtnText: { color: '#000', fontSize: FONT.sm, fontWeight: '700' },

    searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: RADIUS.md, marginHorizontal: 20, marginTop: 12, marginBottom: 28,
      paddingHorizontal: 14, paddingVertical: 12, gap: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    searchPlaceholder: { color: colors.textMuted, fontSize: FONT.md, flex: 1 },

    section: { marginBottom: 28 },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, marginBottom: 14,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: FONT.lg, fontFamily: 'Outfit_700Bold' },
    viewAll: { color: colors.accent, fontSize: FONT.sm, fontWeight: '500' },
    horizontalList: { paddingHorizontal: 20 },

    libraryBanner: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      marginHorizontal: 20, borderRadius: RADIUS.lg, padding: 16, gap: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    libraryBannerIcon: {
      width: 48, height: 48, borderRadius: RADIUS.md,
      backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center',
    },
    libraryBannerText: { flex: 1 },
    libraryBannerTitle: { color: colors.textPrimary, fontSize: FONT.md, fontFamily: 'Outfit_700Bold' },
    libraryBannerSub: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 2 },
    emptyHint: { color: colors.textMuted, fontSize: FONT.sm, marginHorizontal: 20, fontStyle: 'italic' },
  });
}

export default function HomeScreen(): React.JSX.Element {
  const { songs, setSongs, currentSong, isPlaying, play, recentlyPlayed } = usePlayerContext();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleImported = useCallback((newSongs: Song[]) => {
    setSongs(prev => [...prev, ...newSongs]);
  }, [setSongs]);

  const { importSongs, isImporting } = useImportSongs(handleImported);

  const [trending, setTrending] = useState<Song[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    void (async () => {
      try {
        const youtube = await searchYouTube('top hits music 2024', 12, abortRef.current?.signal);
        if (!abortRef.current?.signal.aborted) {
          setTrending(youtube);
        }
      } catch {
        // Network unavailable
      } finally {
        if (!abortRef.current?.signal.aborted) setTrendingLoading(false);
      }
    })();
    return () => { abortRef.current?.abort(); };
  }, []);

  const playStreamed = useCallback(async (song: Song): Promise<void> => {
    // Add all trending songs to queue so next/prev works across the full list
    const toAdd = trending.filter(t => !songs.some(s => s.id === t.id));
    const updatedSongs = toAdd.length > 0 ? [...songs, ...toAdd] : songs;
    if (toAdd.length > 0) setSongs(updatedSongs);
    const index = updatedSongs.findIndex(s => s.id === song.id);
    await play(song, index >= 0 ? index : 0);
  }, [songs, setSongs, play, trending]);

  const artists = useMemo((): Artist[] => {
    const map = new Map<string, Artist>();
    for (const s of songs) {
      const existing = map.get(s.artist);
      if (existing) { existing.songCount += 1; }
      else { map.set(s.artist, { name: s.artist, artwork: s.artwork, songCount: 1 }); }
    }
    return Array.from(map.values());
  }, [songs]);

  const renderRecentItem = ({ item }: ListRenderItemInfo<Song>): React.JSX.Element => (
    <SongCardHorizontal
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={isPlaying && currentSong?.id === item.id}
      onPress={() => void playStreamed(item)}
    />
  );

  const renderTrendingItem = ({ item }: ListRenderItemInfo<Song>): React.JSX.Element => (
    <SongCardHorizontal
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={isPlaying && currentSong?.id === item.id}
      onPress={() => void playStreamed(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>JPlay</Text>
            <Text style={styles.headerSub}>
              {songs.length === 0 ? 'Import songs to get started' : `${songs.length} song${songs.length !== 1 ? 's' : ''} in your library`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => void importSongs()}
            disabled={isImporting}
            accessibilityLabel="Import songs from device"
          >
            {isImporting
              ? <ActivityIndicator size="small" color="#000" />
              : <Ionicons name="add" size={18} color="#000" />
            }
            <Text style={styles.importBtnText}>
              {isImporting ? 'Importing…' : 'Import'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.8} accessibilityLabel="Search songs">
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search songs, artists, genres...</Text>
        </TouchableOpacity>

        {/* ── Recently Played ── */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <TouchableOpacity onPress={() => router.push('/library')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <HorizontalScroller<Song>
              data={recentlyPlayed}
              keyExtractor={(item: Song) => item.id}
              renderItem={renderRecentItem}
              contentContainerStyle={styles.horizontalList}
              bounceDelay={800}
            />
          </View>
        )}

        {/* ── Trending Songs ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Songs</Text>
          </View>
          {trendingLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 20 }} />
          ) : trending.length === 0 ? (
            <Text style={styles.emptyHint}>No trending tracks available. Check your connection.</Text>
          ) : (
            <HorizontalScroller<Song>
              data={trending}
              keyExtractor={(item: Song) => item.id}
              renderItem={renderTrendingItem}
              contentContainerStyle={styles.horizontalList}
              bounceDelay={1000}
            />
          )}
        </View>

        {/* ── Artists ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artists</Text>
            <TouchableOpacity onPress={() => router.push('/library')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <HorizontalScroller
            data={artists}
            keyExtractor={item => item.name}
            renderItem={({ item }) => (
              <ArtistCard
                name={item.name}
                {...(item.artwork !== undefined ? { artwork: item.artwork } : {})}
                songCount={item.songCount}
                onPress={() => router.push('/library')}
              />
            )}
            contentContainerStyle={styles.horizontalList}
            bounceDelay={1200}
          />
        </View>

        {/* ── Library shortcut ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.libraryBanner} onPress={() => router.push('/library')}>
            <View style={styles.libraryBannerIcon}>
              <Ionicons name="library" size={24} color={colors.accent} />
            </View>
            <View style={styles.libraryBannerText}>
              <Text style={styles.libraryBannerTitle}>My Library</Text>
              <Text style={styles.libraryBannerSub}>
                {songs.length === 0 ? 'No songs yet · Import to add' : `${songs.length} song${songs.length !== 1 ? 's' : ''} · Tap to browse`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
