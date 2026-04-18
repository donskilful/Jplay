import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, Share } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SongCard from '../components/SongCard';
import OptionsModal from '../components/OptionsModal';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import type { Song } from '../types';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';
import type { Ionicons as IoniconsType } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof IoniconsType>['name'];

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: colors.textPrimary, fontSize: FONT.xxl, fontFamily: 'Outfit_700Bold' },
    subtitle: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 4 },
    list: { paddingBottom: 100, paddingTop: 8 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyIcon: {
      width: 100, height: 100, borderRadius: RADIUS.xl,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { color: colors.textPrimary, fontSize: FONT.lg, fontWeight: '600' },
    emptySubtitle: { color: colors.textSecondary, fontSize: FONT.md, textAlign: 'center' },
  });
}

export default function FavoritesScreen(): React.JSX.Element {
  const { favoriteSongs, currentSong, isPlaying, play, isFavorite, toggleFavorite } = usePlayerContext();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const buildOptions = (song: Song): { icon: IoniconsName; label: string; onPress: () => void; destructive?: boolean }[] => [
    {
      icon: 'heart' as IoniconsName,
      label: 'Remove from Favorites',
      onPress: () => toggleFavorite(song),
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
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>{favoriteSongs.length} songs</Text>
      </View>

      {favoriteSongs.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>Tap the ♥ on any song in the player to save it here</Text>
        </View>
      ) : (
        <FlatList<Song>
          data={favoriteSongs}
          keyExtractor={(item: Song) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
