import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

interface Option {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface OptionsModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  options: Option[];
  onClose: () => void;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#00000088' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
      paddingBottom: 40,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
      alignSelf: 'center', marginTop: 12, marginBottom: 16,
    },
    songInfo: { paddingHorizontal: 20, paddingBottom: 16 },
    songTitle: { color: colors.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
    songArtist: { color: colors.textSecondary, fontSize: FONT.sm, marginTop: 4 },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20, marginBottom: 8 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14 },
    optionIcon: {
      width: 36, height: 36, borderRadius: RADIUS.sm,
      backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center',
    },
    optionIconDanger: { backgroundColor: '#FF4D6A22' },
    optionLabel: { flex: 1, color: colors.textPrimary, fontSize: FONT.md },
    optionLabelDanger: { color: colors.danger },
    cancelBtn: {
      marginHorizontal: 20, marginTop: 8, paddingVertical: 16,
      borderRadius: RADIUS.md, backgroundColor: colors.surfaceHigh, alignItems: 'center',
    },
    cancelText: { color: colors.textPrimary, fontSize: FONT.md, fontWeight: '600' },
  });
}

export default function OptionsModal({ visible, title, subtitle, options, onClose }: OptionsModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={styles.divider} />

        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => { onClose(); option.onPress(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, option.destructive === true && styles.optionIconDanger]}>
              <Ionicons
                name={option.icon}
                size={18}
                color={option.destructive === true ? colors.danger : colors.accent}
              />
            </View>
            <Text style={[styles.optionLabel, option.destructive === true && styles.optionLabelDanger]}>
              {option.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
