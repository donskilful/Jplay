import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function getPlayIcon(isLoading: boolean, isPlaying: boolean): IconName {
  if (isLoading) return 'hourglass';
  return isPlaying ? 'pause' : 'play';
}

export default function PlayerControls({
  isPlaying,
  isLoading,
  onPlayPause,
  onNext,
  onPrev,
}: PlayerControlsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrev}
        style={styles.button}
        accessibilityLabel="Previous song"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-back" size={32} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPlayPause}
        style={styles.playButton}
        disabled={isLoading}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        <Ionicons name={getPlayIcon(isLoading, isPlaying)} size={40} color="#1DB954" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        style={styles.button}
        accessibilityLabel="Next song"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-forward" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 24,
  },
  button: {
    padding: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
