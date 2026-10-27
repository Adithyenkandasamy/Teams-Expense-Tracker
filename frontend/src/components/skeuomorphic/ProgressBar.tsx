import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { colors } from "../../theme/colors";

interface Props {
  progress: number; // 0 to 100
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 10, color }: Props) {
  const animatedWidth = useRef(new Animated.Value(Math.min(100, Math.max(0, progress)))).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: Math.min(100, Math.max(0, progress)),
      tension: 50,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const barColor = color || colors.primary;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {/* Inset shadow at top of track */}
      <View style={styles.trackInsetShadow} pointerEvents="none" />

      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            backgroundColor: barColor,
            borderRadius: height / 2,
          },
        ]}
      >
        {/* Specular gloss shine at top edge of fill */}
        <View style={styles.fillGloss} pointerEvents="none" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    position: "relative",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 1px 3px rgba(32, 41, 35, 0.12)",
        }
      : {}),
  },
  trackInsetShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  fill: {
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  fillGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
});

