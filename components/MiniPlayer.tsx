import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { usePlayerContext } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 60,
    },
    container: {
      marginHorizontal: 10,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 12,
    },
    progressBar: { height: 2, backgroundColor: colors.surfaceHigh },
    progress: { height: 2, backgroundColor: colors.accent },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    // Left tappable area (artwork + info) — navigates to player
    infoArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    artwork: {
      width: 42, height: 42,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
    },
    artworkImage: { width: 42, height: 42 },
    artworkPlaceholder: {
      width: 42, height: 42,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: FONT.sm, fontWeight: '600' },
    artist: { color: colors.textSecondary, fontSize: FONT.xs, marginTop: 1 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    btn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
    playBtn: {
      width: 38, height: 38,
      borderRadius: 19,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export default function MiniPlayer(): React.JSX.Element | null {
  const {
    currentSong, isPlaying, position, duration,
    playNext, playPrev, togglePlayPause,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat,
  } = usePlayerContext();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pathname = usePathname();
  if (!currentSong || pathname === '/player') return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.row}>
          {/* Tappable info area → opens full player */}
          <TouchableOpacity
            style={styles.infoArea}
            onPress={() => router.push('/player')}
            activeOpacity={0.7}
          >
            <View style={styles.artwork}>
              {currentSong.artwork ? (
                <Image source={{ uri: currentSong.artwork }} style={styles.artworkImage} />
              ) : (
                <View style={styles.artworkPlaceholder}>
                  <Ionicons name="musical-note" size={18} color={colors.accent} />
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
            </View>
          </TouchableOpacity>

          {/* Controls — completely outside the navigation touchable */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.btn} onPress={toggleShuffle} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name="shuffle" size={16} color={isShuffle ? colors.accent : colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => void playPrev()} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name="play-skip-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={() => void togglePlayPause()}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => void playNext()} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name="play-skip-forward" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={toggleRepeat} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name="repeat" size={16} color={repeatMode !== 'off' ? colors.accent : colors.textMuted} />
              {repeatMode === 'one' && (
                <Text style={{ color: colors.accent, fontSize: 7, fontWeight: '800', textAlign: 'center' }}>1</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
