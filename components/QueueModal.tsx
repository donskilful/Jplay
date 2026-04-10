import React, { useMemo } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface QueueModalProps {
  visible: boolean;
  queue: Song[];
  currentSong: Song | null;
  onClose: () => void;
  onSelectSong: (song: Song, index: number) => void;
  queueStartIndex: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
      alignSelf: 'center', marginBottom: 16,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: colors.textPrimary, fontSize: FONT.xl, fontWeight: '700' },
    closeBtn: {
      width: 36, height: 36, borderRadius: RADIUS.full,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    headerSub: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 4 },
    list: { paddingHorizontal: 16, paddingVertical: 8 },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 74 },
    item: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, paddingHorizontal: 4, borderRadius: RADIUS.md, gap: 12,
    },
    itemActive: { backgroundColor: colors.surface, paddingHorizontal: 8 },
    itemArtwork: { width: 50, height: 50, borderRadius: RADIUS.sm, overflow: 'hidden' },
    itemArtworkImage: { width: 50, height: 50 },
    itemArtworkPlaceholder: {
      width: 50, height: 50, backgroundColor: colors.surfaceHigh,
      alignItems: 'center', justifyContent: 'center',
    },
    activeOverlay: {
      ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066',
      alignItems: 'center', justifyContent: 'center',
    },
    itemInfo: { flex: 1 },
    itemTitle: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '500' },
    itemTitleActive: { color: colors.accent, fontWeight: '600' },
    itemArtist: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 3 },
    itemDuration: { color: colors.textMuted, fontSize: FONT.xs },
  });
}

interface QueueItemProps { song: Song; index: number; isActive: boolean; onPress: () => void; colors: ThemeColors; styles: ReturnType<typeof makeStyles> }

function QueueItem({ song, isActive, onPress, colors, styles }: QueueItemProps): React.JSX.Element {
  return (
    <TouchableOpacity style={[styles.item, isActive && styles.itemActive]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemArtwork}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.itemArtworkImage} />
        ) : (
          <View style={styles.itemArtworkPlaceholder}>
            <Ionicons name="musical-note" size={16} color={colors.accent} />
          </View>
        )}
        {isActive && (
          <View style={styles.activeOverlay}>
            <Ionicons name="volume-high" size={12} color={colors.accent} />
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.itemArtist} numberOfLines={1}>{song.artist} · {song.genre}</Text>
      </View>
      {song.duration !== undefined && (
        <Text style={styles.itemDuration}>{formatDuration(song.duration)}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function QueueModal({ visible, queue, currentSong, onClose, onSelectSong, queueStartIndex }: QueueModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderItem = ({ item, index }: ListRenderItemInfo<Song>): React.JSX.Element => (
    <QueueItem
      song={item} index={index}
      isActive={item.id === currentSong?.id}
      onPress={() => onSelectSong(item, queueStartIndex + index)}
      colors={colors} styles={styles}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Up Next</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>{queue.length} songs in queue</Text>
        </View>
        <FlatList<Song>
          data={queue}
          keyExtractor={(item: Song) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </Modal>
  );
}
