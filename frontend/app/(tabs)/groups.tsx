import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getGroups } from "../../src/api/groups";
import { colors, spacing, typography } from "../../src/theme/colors";
import { GroupCard } from "../../src/components/group/GroupCard";
import { Header } from "../../src/components/common/Header";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";
import { Button } from "../../src/components/common/Button";

export default function GroupsScreen() {
  const router = useRouter();

  const {
    data: groups = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Your Groups"
        subtitle="Manage roommates & teams"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/groups/join")}
              activeOpacity={0.7}
            >
              <Ionicons name="enter-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/groups/create")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.buttonBanner}>
        <View style={styles.buttonCol}>
          <Button
            title="Create Group"
            icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
            onPress={() => router.push("/groups/create")}
            size="small"
          />
        </View>
        <View style={styles.buttonCol}>
          <Button
            title="Join with Code"
            icon={<Ionicons name="key-outline" size={16} color={colors.textPrimary} />}
            variant="outline"
            onPress={() => router.push("/groups/join")}
            size="small"
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingState message="Loading your groups..." fullScreen />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Groups Joined"
          description="You are not part of any team or roommate group yet. Create your first group or ask your roommate for an invite code."
          actionTitle="Create First Group"
          onAction={() => router.push("/groups/create")}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/groups/${item.id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonBanner: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  buttonCol: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
