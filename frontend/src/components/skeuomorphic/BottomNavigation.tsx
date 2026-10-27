import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, shadows, typography } from "../../theme/colors";

export interface BottomNavigationProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const PRIMARY_TABS = [
  { name: "home", label: "Home", icon: "home" as const, outlineIcon: "home-outline" as const },
  { name: "stats", label: "Stats", icon: "bar-chart" as const, outlineIcon: "bar-chart-outline" as const },
  { name: "add", label: "Add", icon: "add" as const, outlineIcon: "add" as const, isCenter: true },
  { name: "targets", label: "Targets", icon: "flag" as const, outlineIcon: "flag-outline" as const },
  { name: "more", label: "More", icon: "grid" as const, outlineIcon: "grid-outline" as const },
];

export function BottomNavigation({ state, descriptors, navigation }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Filter routes to only include our 5 primary tabs
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.barContainer,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 10 : 8),
        },
      ]}
    >
      {/* Specular top highlight bevel */}
      <View style={styles.topBevel} pointerEvents="none" />

      <View style={styles.tabItemsRow}>
        {PRIMARY_TABS.map((tab) => {
          const isFocused = activeRouteName === tab.name;

          if (tab.isCenter) {
            return (
              <CenterAddButton
                key={tab.name}
                onPress={() => router.push("/expenses/create")}
              />
            );
          }

          const handleTabPress = () => {
            const route = state.routes.find((r: any) => r.name === tab.name);
            if (!route) {
              router.push(`/(tabs)/${tab.name}` as any);
              return;
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={handleTabPress}
              activeOpacity={0.8}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                ]}
              >
                {isFocused && <View style={styles.activeTopBevel} pointerEvents="none" />}
                <Ionicons
                  name={isFocused ? tab.icon : tab.outlineIcon}
                  size={21}
                  color={isFocused ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function CenterAddButton({ onPress }: { onPress: () => void }) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 350, friction: 18 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: Platform.OS !== "web", tension: 350, friction: 18 }).start();
  };

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.93],
  });

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, -10],
  });

  return (
    <View style={styles.centerTabItem}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Add Expense"
      >
        <Animated.View
          style={[
            styles.raisedAddCircle,
            { transform: [{ translateY }, { scale }] },
          ]}
        >
          {/* Specular glossy highlight top cap */}
          <View style={styles.addCircleGloss} pointerEvents="none" />

          <Ionicons name="add" size={30} color={colors.textInverse} />
        </Animated.View>
      </Pressable>
      <Text style={styles.centerAddLabel}>Add</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    position: "relative",
    zIndex: 100,
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 -3px 12px rgba(32, 41, 35, 0.05)",
        }
      : {}),
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  tabItemsRow: {
    flexDirection: "row",
    height: 58,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingTop: 4,
  },
  iconContainer: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  activeIconContainer: {
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    position: "relative",
    overflow: "hidden",
  },
  activeTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: "700",
  },
  centerTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  raisedAddCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderTopColor: colors.buttonBevelTop,
    borderBottomWidth: 3,
    borderBottomColor: colors.buttonBevelBottom,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 6px 14px rgba(35, 122, 87, 0.35), 0 2px 4px rgba(35, 122, 87, 0.20)",
        }
      : {}),
  },
  addCircleGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  centerAddLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    marginTop: -8,
  },
});
