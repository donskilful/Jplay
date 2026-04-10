import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface UpNextItemProps {
  song: Song;
  isActive: boolean;
  isLiked: boolean;
  onPress: () => void;
  onFavorite: () => void;
  onOptions: () => void;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
    artwork: { width: 48, height: 48, borderRadius: RADIUS.sm, overflow: 'hidden' },
    artworkImage: { width: 48, height: 48 },
    artworkPlaceholder: {
      width: 48, height: 48, backgroundColor: colors.surfaceHigh,
      alignItems: 'center', justifyContent: 'center',
    },
    activeOverlay: {
      ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066',
      alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '500' },
    activeTitle: { color: colors.accent },
    artist: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 2 },
    action: { paddingHorizontal: 4 },
  });
}

export default function UpNextItem({ song, isActive, isLiked, onPress, onFavorite, onOptions }: UpNextItemProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.artwork}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.artworkImage} />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Ionicons name="musical-note" size={18} color={colors.accent} />
          </View>
        )}
        {isActive && (
          <View style={styles.activeOverlay}>
            <Ionicons name="volume-high" size={14} color={colors.accent} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
      </View>

      <TouchableOpacity
        style={styles.action}
        onPress={(e) => { e.stopPropagation(); onFavorite(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      >
        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? colors.danger : colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.action}
        onPress={(e) => { e.stopPropagation(); onOptions(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Song options"
      >
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
