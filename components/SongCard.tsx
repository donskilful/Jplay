import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isActive: boolean;
  onPress: () => void;
  onOptions: () => void;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function getActiveIcon(isPlaying: boolean): IoniconsName {
  return isPlaying ? 'volume-high' : 'pause';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 10,
      marginHorizontal: 12, marginVertical: 2,
      borderRadius: RADIUS.md, gap: 14,
    },
    active: { backgroundColor: colors.surface },
    artwork: { width: 52, height: 52, borderRadius: RADIUS.sm, overflow: 'hidden' },
    artworkImage: { width: 52, height: 52 },
    artworkPlaceholder: {
      width: 52, height: 52, backgroundColor: colors.surfaceHigh,
      alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '500', flexShrink: 1 },
    activeTitle: { color: colors.accent, fontWeight: '600' },
    badgeFull: {
      backgroundColor: colors.accent + '22', borderRadius: 4,
      paddingHorizontal: 5, paddingVertical: 1,
    },
    badgePreview: {
      backgroundColor: '#FF980022', borderRadius: 4,
      paddingHorizontal: 5, paddingVertical: 1,
    },
    badgeTextFull: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    badgeTextPreview: { color: '#FF9800', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    artist: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 3 },
    meta: { color: colors.textMuted, fontSize: FONT.xs, marginTop: 2 },
    right: { alignItems: 'center', gap: 4 },
    duration: { color: colors.textMuted, fontSize: FONT.xs },
  });
}

export default function SongCard({
  song, isPlaying, isActive, onPress, onOptions,
}: SongCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.active]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${song.title} by ${song.artist}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.artwork}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.artworkImage} accessibilityLabel={`Album art for ${song.title}`} />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Ionicons name="musical-note" size={22} color={colors.accent} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={1}>{song.title}</Text>
          {song.source === 'deezer' && (
            <View style={styles.badgePreview}><Text style={styles.badgeTextPreview}>DEEZER</Text></View>
          )}
          {song.source === 'itunes' && (
            <View style={styles.badgePreview}><Text style={styles.badgeTextPreview}>ITUNES</Text></View>
          )}
        </View>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        <Text style={styles.meta} numberOfLines={1}>{song.album} · {song.genre}</Text>
      </View>

      <View style={styles.right}>
        {song.duration !== undefined && (
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
        )}
        {isActive ? (
          <Ionicons name={getActiveIcon(isPlaying)} size={16} color={colors.accent} />
        ) : (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onOptions(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Song options"
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
