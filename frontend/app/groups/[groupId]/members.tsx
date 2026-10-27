import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroupDetail, getGroupMembers, removeGroupMember } from "../../../src/api/groups";
import { useAuthStore } from "../../../src/store/authStore";
import { colors, spacing, typography } from "../../../src/theme/colors";
import { Header } from "../../../src/components/common/Header";
import { MemberRow } from "../../../src/components/group/MemberRow";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { EmptyState } from "../../../src/components/common/EmptyState";
import { ConfirmModal } from "../../../src/components/common/ConfirmModal";
import { GroupMember } from "../../../src/types/models";

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [memberToRemove, setMemberToRemove] = React.useState<GroupMember | null>(null);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupDetail(groupId),
    enabled: !!groupId,
  });

  const {
    data: members = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
  });

  const removeMutation = useMutation({
    mutationFn: (memberUserId: string) => removeGroupMember(groupId, memberUserId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] }),
        queryClient.invalidateQueries({ queryKey: ["group", groupId] }),
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["groupBalances", groupId] }),
        queryClient.invalidateQueries({ queryKey: ["allExpenses"] }),
      ]);
      setMemberToRemove(null);
    },
    onError: (error: Error) => Alert.alert("Could not remove member", error.message),
  });

  const canManageMembers = group?.created_by === currentUserId || group?.leader_id === currentUserId;

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
              onRemove={canManageMembers && item.user_id !== currentUserId && item.user_id !== group?.created_by && item.role !== "OWNER"
                ? () => setMemberToRemove(item)
                : undefined}
            />
          )}
        />
      )}
      <ConfirmModal
        visible={!!memberToRemove}
        title="Remove this member?"
        message={`${memberToRemove?.user?.name || "This member"} will lose access to the group. Their unpaid or submitted expense shares must be settled before removal.`}
        confirmText="Remove Member"
        confirmVariant="danger"
        loading={removeMutation.isPending}
        onConfirm={() => { if (memberToRemove) removeMutation.mutate(memberToRemove.user_id); }}
        onCancel={() => setMemberToRemove(null)}
      />
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
