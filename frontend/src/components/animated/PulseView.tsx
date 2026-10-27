import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp, Platform } from "react-native";

interface PulseViewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  minScale = 0.96,
  maxScale = 1.04,
  duration = 1800,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: duration / 2,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: duration / 2,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    pulseAnim.start();

    return () => pulseAnim.stop();
  }, [scale, minScale, maxScale, duration]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};
