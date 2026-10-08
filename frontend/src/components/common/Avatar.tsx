import React from "react";
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from "react-native";
import { colors } from "../../theme/colors";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 40,
  style,
}) => {
  const getInitials = (fullName: string) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style as ImageStyle,
        ]}
      />
    );
  }

  // Consistent background color hash from name
  const getBackgroundColor = (str: string) => {
    const palette = [
      "#6366F1", // Indigo
      "#10B981", // Emerald
      "#3B82F6", // Blue
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#8B5CF6", // Purple
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  };

  const bg = getBackgroundColor(name || "");

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        style as ViewStyle,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: Math.floor(size * 0.4) },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceElevated,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
