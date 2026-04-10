import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Switch,
  TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: colors.textPrimary, fontSize: FONT.xxl, fontFamily: 'PlayfairDisplay_700Bold' },
    section: { marginBottom: 24, paddingHorizontal: 16 },
    sectionLabel: {
      color: colors.textMuted, fontSize: FONT.xs, fontWeight: '700',
      letterSpacing: 1.2, marginBottom: 8, marginLeft: 4,
    },
    card: { backgroundColor: colors.surface, borderRadius: RADIUS.md, overflow: 'hidden' },
    sep: { height: 1, backgroundColor: colors.border, marginLeft: 60 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    iconWrap: {
      width: 32, height: 32, borderRadius: RADIUS.sm,
      backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center',
    },
    label: { flex: 1, color: colors.textPrimary, fontSize: FONT.md },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { color: colors.textSecondary, fontSize: FONT.sm },

    // About modal
    aboutModal: { flex: 1, backgroundColor: colors.bg },
    aboutSheet: { flex: 1 },
    aboutHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    aboutTitle: { color: colors.textPrimary, fontSize: FONT.xl, fontFamily: 'PlayfairDisplay_700Bold' },
    aboutClose: {
      width: 36, height: 36, borderRadius: RADIUS.full,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    aboutScroll: { padding: 20 },
    aboutAppName: {
      color: colors.accent, fontSize: FONT.xxl,
      fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 4,
    },
    aboutVersion: { color: colors.textSecondary, fontSize: FONT.sm, marginBottom: 20 },
    aboutBody: { color: colors.textSecondary, fontSize: FONT.md, lineHeight: 24 },
    aboutSectionHead: {
      color: colors.textPrimary, fontSize: FONT.md, fontWeight: '700', marginTop: 20, marginBottom: 6,
    },
    aboutDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    aboutFooter: { color: colors.textMuted, fontSize: FONT.xs, textAlign: 'center', marginTop: 8 },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}

function SettingRow({ icon, label, value, toggle, toggled, onToggle, onPress, colors, styles }: RowProps): React.JSX.Element {
  const inner = (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        {toggle === true ? (
          <Switch
            value={toggled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        ) : (
          <>
            {value !== undefined && <Text style={styles.value}>{value}</Text>}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ─── About Modal ──────────────────────────────────────────────────────────────

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}

function AboutModal({ visible, onClose, colors, styles }: AboutModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.aboutModal}>
      <SafeAreaView style={styles.aboutSheet}>
        <View style={styles.aboutHeader}>
          <Text style={styles.aboutTitle}>About JPlay</Text>
          <TouchableOpacity style={styles.aboutClose} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.aboutScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.aboutAppName}>JPlay</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>

          <Text style={styles.aboutBody}>
            Your write-up will appear here. Send it over and I'll drop it in.
          </Text>

          <View style={styles.aboutDivider} />
          <Text style={styles.aboutFooter}>© 2026 JPlay · All rights reserved</Text>
        </ScrollView>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen(): React.JSX.Element {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [notifications, setNotifications] = React.useState(false);
  const [showAbout, setShowAbout] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* APPEARANCE */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny'}
            label="Dark Mode"
            toggle
            toggled={isDark}
            onToggle={toggleTheme}
            colors={colors}
            styles={styles}
          />
        </View>
      </View>

      {/* GENERAL */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GENERAL</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            toggle
            toggled={notifications}
            onToggle={setNotifications}
            colors={colors}
            styles={styles}
          />
          <View style={styles.sep} />
          <SettingRow
            icon="information-circle-outline"
            label="About"
            onPress={() => setShowAbout(true)}
            colors={colors}
            styles={styles}
          />
        </View>
      </View>

      {/* Modals */}
      <AboutModal
        visible={showAbout}
        onClose={() => setShowAbout(false)}
        colors={colors}
        styles={styles}
      />
    </SafeAreaView>
  );
}
