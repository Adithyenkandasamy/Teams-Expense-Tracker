import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getGroupMembers } from "../../../src/api/groups";
import { useAuthStore } from "../../../src/store/authStore";
import { colors, spacing, typography } from "../../../src/theme/colors";
import { Header } from "../../../src/components/common/Header";
import { MemberRow } from "../../../src/components/group/MemberRow";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { EmptyState } from "../../../src/components/common/EmptyState";

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const {
    data: members = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Group Members"
        subtitle={`${members.length} total`}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(`/groups/${groupId}` as any);
          }
        }}

      />

      <View style={styles.roleExplanation}>
        <Text style={styles.roleText}>
          Group Leader manages the group. Any member can create an expense to become that expense's Expense Leader.
        </Text>
      </View>

      {isLoading ? (
        <LoadingState message="Loading members..." fullScreen />
      ) : members.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Members Found"
          description="Could not load group members."
        />
      ) : (
        <FlatList
          data={members}
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
            <MemberRow
              member={item}
              isCurrentUser={item.user_id === currentUserId}
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
  roleExplanation: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
