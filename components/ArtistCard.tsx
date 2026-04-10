import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface ArtistCardProps {
  name: string;
  artwork?: string;
  songCount: number;
  onPress: () => void;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { width: 100, marginRight: 16, alignItems: 'center' },
    avatarWrapper: {
      width: 90, height: 90, borderRadius: 45, overflow: 'hidden',
      marginBottom: 8, borderWidth: 2, borderColor: colors.border,
    },
    avatar: { width: 90, height: 90 },
    placeholder: { backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
    name: { color: colors.textPrimary, fontSize: FONT.sm, fontWeight: '600', textAlign: 'center' },
    count: { color: colors.textSecondary, fontSize: FONT.xs, marginTop: 2, textAlign: 'center' },
  });
}

export default function ArtistCard({ name, artwork, songCount, onPress }: ArtistCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatarWrapper}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Ionicons name="person" size={36} color={colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.count}>{songCount} songs</Text>
    </TouchableOpacity>
  );
}
