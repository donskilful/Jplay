import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface SongCardHorizontalProps {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: 130, marginRight: 14 },
    artworkWrapper: { width: 130, height: 130, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 8 },
    artwork: { width: 130, height: 130 },
    placeholder: { backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
    overlay: {
      ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055',
      alignItems: 'center', justifyContent: 'center',
    },
    badge: {
      position: 'absolute', bottom: 6, left: 6,
      borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
    },
    badgeFull: { backgroundColor: colors.accent + 'DD' },
    badgePreview: { backgroundColor: '#FF9800DD' },
    badgeText: { color: '#000', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
    title: { color: colors.textPrimary, fontSize: FONT.sm, fontWeight: '600' },
    activeTitle: { color: colors.accent },
    artist: { color: colors.textSecondary, fontSize: FONT.xs, marginTop: 2 },
  });
}

export default function SongCardHorizontal({ song, isActive, isPlaying, onPress }: SongCardHorizontalProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.artworkWrapper}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.placeholder]}>
            <Ionicons name="musical-note" size={32} color={colors.accent} />
          </View>
        )}
        {isActive && (
          <View style={styles.overlay}>
            <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color={colors.accent} />
          </View>
        )}
        {song.source === 'deezer' && (
          <View style={[styles.badge, styles.badgePreview]}>
            <Text style={styles.badgeText}>DEEZER</Text>
          </View>
        )}
        {song.source === 'itunes' && (
          <View style={[styles.badge, styles.badgePreview]}>
            <Text style={styles.badgeText}>ITUNES</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={1}>{song.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
    </TouchableOpacity>
  );
}
