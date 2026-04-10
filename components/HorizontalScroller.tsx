import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FlatList, View, Animated, StyleSheet,
} from 'react-native';
import type { FlatListProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface HorizontalScrollerProps<T> extends Omit<FlatListProps<T>, 'horizontal'> {
  bounceDelay?: number;
}

export default function HorizontalScroller<T>({
  bounceDelay = 900,
  contentContainerStyle,
  onScroll,
  ...props
}: HorizontalScrollerProps<T>): React.JSX.Element {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<T>>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Pulsing arrow animation
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 8, duration: 500, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [arrowAnim]);

  // Bounce scroll hint on mount
  useEffect(() => {
    if ((props.data as T[])?.length === 0) return;
    const t1 = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 72, animated: true });
    }, bounceDelay);
    const t2 = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, bounceDelay + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean((props.data as T[])?.length)]);

  const handleScroll = useCallback((e: Parameters<NonNullable<FlatListProps<T>['onScroll']>>[0]) => {
    if (!hasScrolled && e.nativeEvent.contentOffset.x > 10) {
      setHasScrolled(true);
      Animated.timing(arrowOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start();
    }
    onScroll?.(e);
  }, [hasScrolled, arrowOpacity, onScroll]);

  return (
    <View style={styles.wrapper}>
      <FlatList<T>
        {...props}
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {!hasScrolled && (
        <Animated.View
          style={[
            styles.arrowContainer,
            { opacity: arrowOpacity, transform: [{ translateX: arrowAnim }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.arrowBg, { backgroundColor: colors.surface + 'EE' }]}>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  arrowContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  arrowBg: {
    borderRadius: 20,
    padding: 6,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
