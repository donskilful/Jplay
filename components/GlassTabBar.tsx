import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { FONT } from '../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_BAR_HEIGHT = 49;

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tint = isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

  return (
    <BlurView
      tint={tint}
      intensity={80}
      style={[styles.blur, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}
    >
      {/* Hairline separator on top */}
      <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }]} />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const isFocused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = (): void => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, {});
            }
          };

          const iconColor = isFocused ? colors.accent : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)');
          const labelColor = isFocused ? colors.accent : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)');

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: iconColor,
                size: 24,
              })}
              <Text style={[styles.label, { color: labelColor, fontWeight: isFocused ? '600' : '400' }]}>
                {label}
              </Text>
              {isFocused && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // On Android BlurView is not supported well — fall back to solid bg
    ...Platform.select({ android: { backgroundColor: 'rgba(18,18,18,0.96)' } }),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 2,
  },
  label: {
    fontSize: FONT.xs,
    letterSpacing: 0.1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
