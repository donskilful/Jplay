import React from 'react';
import Svg, { Circle, Polygon, Text, Defs, LinearGradient, Stop, G, ClipPath } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

/**
 * Circular JPlay icon — dark-theme variant.
 * Matches jplay_dark.svg but without the square background rect
 * so it sits cleanly on any dark surface.
 */
export default function Logo({ size = 42 }: LogoProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Defs>
        <LinearGradient id="grad1" x1="0%" y1="0%" x2="135%" y2="100%">
          <Stop offset="0%" stopColor="#7C6FFF" />
          <Stop offset="100%" stopColor="#4ABAFF" />
        </LinearGradient>
        <ClipPath id="clipD">
          <Circle cx="200" cy="200" r="175" />
        </ClipPath>
      </Defs>

      {/* Gradient circle */}
      <Circle cx="200" cy="200" r="178" fill="url(#grad1)" />

      <G clipPath="url(#clipD)">
        {/* Bold J */}
        <Text
          x="72"
          y="238"
          fontFamily="Georgia, serif"
          fontSize="120"
          fontWeight="700"
          fill="white"
        >
          J
        </Text>

        {/* Play triangle replacing P */}
        <Polygon points="162,138 162,242 220,190" fill="white" opacity="0.92" />

        {/* l */}
        <Text x="224" y="238" fontFamily="Georgia, serif" fontSize="72" fontWeight="400" fill="white" opacity="0.9">l</Text>
        {/* a */}
        <Text x="247" y="238" fontFamily="Georgia, serif" fontSize="72" fontWeight="400" fill="white" opacity="0.9">a</Text>
        {/* y */}
        <Text x="295" y="238" fontFamily="Georgia, serif" fontSize="72" fontWeight="400" fill="white" opacity="0.9">y</Text>
      </G>
    </Svg>
  );
}
