import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (positionMillis: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds: number = Math.floor(ms / 1000);
  const minutes: number = Math.floor(totalSeconds / 60);
  const seconds: number = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ProgressBar({ position, duration, onSeek }: ProgressBarProps): React.JSX.Element {
  const safeMax: number = duration > 0 ? duration : 1;

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={safeMax}
        value={position}
        onSlidingComplete={onSeek}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#535353"
        thumbTintColor="#1DB954"
        accessibilityLabel="Song progress"
      />
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  time: {
    color: '#b3b3b3',
    fontSize: 12,
  },
});
