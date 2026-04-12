import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Dimensions, AppState } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubeIframe from 'react-native-youtube-iframe';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PlayerProvider, usePlayerContext } from '../context/PlayerContext';
import MiniPlayer from '../components/MiniPlayer';

const SCREEN_W = Dimensions.get('window').width;
const VIDEO_W = SCREEN_W - 64;
const VIDEO_H = Math.round(VIDEO_W * 9 / 16);
const PLAYER_HEADER_H = 64; // paddingTop(8) + button(40) + paddingBottom(16)

SplashScreen.preventAutoHideAsync();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
interface TabIconProps { color: string; size: number; focused: boolean }

function GlassBackground(): React.JSX.Element {
  const { isDark } = useTheme();
  if (Platform.OS !== 'ios') {
    // Android: solid fallback
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
    </Tabs>
  );
}

// Persistent YouTube player — lives OUTSIDE the tab system so it never unmounts
// when switching tabs, keeping audio alive in the background.
function PersistentYouTubePlayer(): React.JSX.Element | null {
  const { currentSong, ytPlaying, setYtPlaying, audioOnly, playNext, setYtPosition, setYtDuration } = usePlayerContext();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const ytRef = useRef<YoutubeIframeRef>(null);
  // Tracks whether this video has played at least once.
  // Guards against YouTube's initialization 'paused' event overriding ytPlaying
  // before the first successful play (which would break our play button).
  const hasPlayedRef = useRef(false);
  // Debounce ref: YouTube fires 'paused' transiently during buffering.
  // We only commit ytPlaying=false if no 'playing' event follows within 500 ms.
  const pauseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const [ytReady, setYtReady] = React.useState(false);

  // Track foreground/background so we don't treat background pause as user pause.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Reset guards whenever the video changes (this component never unmounts).
  useEffect(() => {
    hasPlayedRef.current = false;
    setYtReady(false);
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current);
      pauseDebounceRef.current = null;
    }
  }, [currentSong?.youtubeVideoId]);

  // If UI requests play, cancel any pending debounced pause commit from a
  // transient YouTube "paused" event so controls don't desync.
  useEffect(() => {
    if (!ytPlaying) return;
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current);
      pauseDebounceRef.current = null;
    }
  }, [ytPlaying]);

  // Poll position/duration every second while playing
  useEffect(() => {
    if (!ytPlaying || !ytReady) return;
    const id = setInterval(() => {
      void (async () => {
        const pos = await ytRef.current?.getCurrentTime() ?? 0;
        const dur = await ytRef.current?.getDuration() ?? 0;
        setYtPosition(pos);
        if (dur > 0) setYtDuration(dur);
      })();
    }, 1000);
    return () => clearInterval(id);
  }, [ytPlaying, ytReady, setYtPosition, setYtDuration]);

  if (!currentSong || currentSong.source !== 'youtube' || !currentSong.youtubeVideoId) {
    return null;
  }

  const isOnPlayer = pathname === '/player';
  const showVideo = isOnPlayer && !audioOnly;
  const showAudioOnlyOnPlayer = isOnPlayer && audioOnly;

  // When showing video: overlay exactly over the player screen placeholder.
  // When in audio-only on player: keep same size/position but nearly invisible
  // so iOS still treats it as an active player and autoplay remains reliable.
  // When fully hidden (other tabs): keep off-screen valid-size viewport.
  const videoStyle = (showVideo || showAudioOnlyOnPlayer)
    ? {
        top: insets.top + PLAYER_HEADER_H,
        left: 32,
        width: VIDEO_W,
        height: VIDEO_H,
        borderRadius: 12,
        opacity: showAudioOnlyOnPlayer ? 0.02 : 1,
        zIndex: 50,
      }
    : {
        top: -1000,
        left: -1000,
        width: 220,
        height: 124,
        borderRadius: 0,
        opacity: 0.01,
        zIndex: -1,
      };

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: videoStyle.zIndex }]} pointerEvents="box-none">
      <View
        style={{
          position: 'absolute',
          overflow: 'hidden',
          ...videoStyle,
        }}
      >
        <YoutubeIframe
          key={currentSong.youtubeVideoId}
          ref={ytRef}
          videoId={currentSong.youtubeVideoId}
          height={showVideo || showAudioOnlyOnPlayer ? VIDEO_H : 1}
          width={showVideo || showAudioOnlyOnPlayer ? VIDEO_W : 1}
          play={ytPlaying}
          forceAndroidAutoplay
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialPlayerParams={{ autoplay: 1, controls: 1, rel: 0 } as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          webViewProps={({
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            allowsBackgroundMediaPlayback: true,
          }) as any}
          // Ensure ytPlaying is true when the YouTube player is ready so the
          // play prop triggers correctly after any initialization 'paused' event.
          onReady={() => {
            setYtReady(true);
            setYtPlaying(true);
          }}
          onChangeState={(state) => {
            if (state === 'playing') {
              hasPlayedRef.current = true;
              // Cancel any pending pause commit — this was a transient buffer pause.
              if (pauseDebounceRef.current) {
                clearTimeout(pauseDebounceRef.current);
                pauseDebounceRef.current = null;
              }
              setYtPlaying(true);
            }
            // Only sync 'paused' after the first successful play and only after
            // a 500 ms delay. YouTube fires 'paused' transiently during buffering
            // (immediately followed by 'playing'). The debounce lets those
            // transient events get cancelled so they don't kill playback.
            if (state === 'paused' && hasPlayedRef.current && appStateRef.current === 'active') {
              pauseDebounceRef.current = setTimeout(() => {
                setYtPlaying(false);
              }, 500);
            }
            if (state === 'ended') void playNext();
          }}
        />
      </View>
    </View>
  );
}

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <PlayerProvider>
        <View style={{ flex: 1 }}>
          <TabsNavigator />
          <MiniPlayer />
          <PersistentYouTubePlayer />
        </View>
      </PlayerProvider>
    </ThemeProvider>
  );
}
