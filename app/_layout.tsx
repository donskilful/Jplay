import TrackPlayer from 'react-native-track-player';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';

// Register the background playback service once at module load time
TrackPlayer.registerPlaybackService(() => require('../services/trackPlayerService'));
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PlayerProvider } from '../context/PlayerContext';
import MiniPlayer from '../components/MiniPlayer';
import { useDeviceRegistration } from '../hooks/useDeviceRegistration';

SplashScreen.preventAutoHideAsync();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
interface TabIconProps { color: string; size: number; focused: boolean }

function GlassBackground(): React.JSX.Element {
  const { isDark } = useTheme();
  if (Platform.OS !== 'ios') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#111' : '#f2f2f2' }]} />;
  }
  return (
    <BlurView
      tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      intensity={80}
      style={StyleSheet.absoluteFill}
    />
  );
}

function TabsNavigator(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarBackground: () => <GlassBackground />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }: TabIconProps): React.JSX.Element => (
            <Ionicons name={(focused ? 'home' : 'home-outline') as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="player"
        options={{
          title: 'Playing',
          tabBarIcon: ({ color, size, focused }: TabIconProps): React.JSX.Element => (
            <Ionicons name={(focused ? 'musical-notes' : 'musical-notes-outline') as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size, focused }: TabIconProps): React.JSX.Element => (
            <Ionicons name={(focused ? 'heart' : 'heart-outline') as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }: TabIconProps): React.JSX.Element => (
            <Ionicons name={(focused ? 'settings' : 'settings-outline') as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="library" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="notification.click" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });
  useDeviceRegistration();

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <PlayerProvider>
        <View style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0A1A" />
          <TabsNavigator />
          <MiniPlayer />
        </View>
      </PlayerProvider>
    </ThemeProvider>
  );
}
