import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

interface AnimatedProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function AnimatedProgressBar({
  progress,
  color = colors.success,
  trackColor = colors.surfaceElevated,
  height = 8,
  style,
}: AnimatedProgressBarProps) {
  const progressValue = useRef(new Animated.Value(0)).current;
  const boundedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    progressValue.setValue(0);
    const animation = Animated.timing(progressValue, {
      toValue: boundedProgress,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [boundedProgress, progressValue]);

  const width = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", borderRadius: 100 },
  fill: { height: "100%", borderRadius: 100 },
});
