import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PlayerProvider } from '../context/PlayerContext';
import MiniPlayer from '../components/MiniPlayer';

SplashScreen.preventAutoHideAsync();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
interface TabIconProps { color: string; size: number }

function TabsNavigator(): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: TabIconProps): React.JSX.Element => (
            <Ionicons name={'home' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="player"
        options={{
          title: 'Playing',
          tabBarIcon: ({ color, size }: TabIconProps): React.JSX.Element => (
            <Ionicons name={'musical-notes' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }: TabIconProps): React.JSX.Element => (
            <Ionicons name={'heart' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: TabIconProps): React.JSX.Element => (
            <Ionicons name={'settings-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="library" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });

  useEffect(() => {
    // Show app whether fonts loaded successfully or failed — never hang on white screen
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <PlayerProvider>
        <View style={{ flex: 1 }}>
          <TabsNavigator />
          <MiniPlayer />
        </View>
      </PlayerProvider>
    </ThemeProvider>
  );
}

