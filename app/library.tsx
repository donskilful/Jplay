import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Text, StyleSheet, SafeAreaView, View, Share, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import SongCard from '../components/SongCard';
import OptionsModal from '../components/OptionsModal';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useImportSongs } from '../hooks/useImportSongs';
import type { Song } from '../types';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';
import type { Ionicons as IoniconsType } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof IoniconsType>['name'];

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: FONT.xxl, fontFamily: 'Outfit_700Bold' },
    subtitle: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 4 },
    importBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.accent, borderRadius: RADIUS.md,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    importBtnText: { color: '#000', fontSize: FONT.sm, fontWeight: '700' },
    list: { paddingBottom: 100, paddingTop: 8 },
  });
}

export default function LibraryScreen(): React.JSX.Element {
  const { songs, setSongs, currentSong, isPlaying, play, toggleFavorite, isFavorite } = usePlayerContext();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleImported = useCallback((newSongs: Song[]) => {
    setSongs(prev => [...prev, ...newSongs]);
  }, [setSongs]);
  const { importSongs, isImporting } = useImportSongs(handleImported);

  const buildOptions = (song: Song): { icon: IoniconsName; label: string; onPress: () => void; destructive?: boolean }[] => [
    {
      icon: 'heart' as IoniconsName,
      label: isFavorite(song.id) ? 'Remove from Favorites' : 'Add to Favorites',
      onPress: () => toggleFavorite(song),
    },
    {
      icon: 'play-circle' as IoniconsName,
      label: 'Play Now',
      onPress: () => {
        const index = songs.findIndex(s => s.id === song.id);
        void play(song, index >= 0 ? index : 0);
      },
    },
    {
      icon: 'share-social' as IoniconsName,
      label: 'Share',
      onPress: () => {
        void Share.share({
          title: song.title,
          message: `🎵 "${song.title}" by ${song.artist}\nAlbum: ${song.album} · ${song.genre}\n\nListening on JsPlay`,
        });
      },
    },
    {
      icon: 'flag' as IoniconsName,
      label: 'Report',
      onPress: () => { /* future */ },
      destructive: true,
    },
  ];

  const renderItem = ({ item, index }: ListRenderItemInfo<Song>): React.JSX.Element => (
    <SongCard
      song={item}
      isActive={currentSong?.id === item.id}
      isPlaying={isPlaying && currentSong?.id === item.id}
      onPress={() => void play(item, index)}
      onOptions={() => setSelectedSong(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>My Library</Text>
          <Text style={styles.subtitle}>{songs.length} songs</Text>
        </View>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => void importSongs()}
          disabled={isImporting}
          accessibilityLabel="Import songs"
        >
          {isImporting
            ? <ActivityIndicator size="small" color="#000" />
            : <Ionicons name="add" size={16} color="#000" />
          }
          <Text style={styles.importBtnText}>{isImporting ? 'Adding…' : 'Import'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Song>
        data={songs}
        keyExtractor={(item: Song) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

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
