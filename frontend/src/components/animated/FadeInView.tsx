import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle, StyleProp, Platform } from "react-native";

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideDistance?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 320,
  slideDistance = 12,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;
  const scale = useRef(new Animated.Value(0.99)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [delay, duration, opacity, scale, slideDistance, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
