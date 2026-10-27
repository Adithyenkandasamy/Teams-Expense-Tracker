import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: Platform.OS !== "web",
      speed: 42,
      bounciness: 3,
      isInteraction: false,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 38,
      bounciness: 4,
      isInteraction: false,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
