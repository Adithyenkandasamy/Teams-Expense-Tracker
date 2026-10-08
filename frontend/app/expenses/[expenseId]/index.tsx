import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getExpenseDetail, closeExpense } from "../../../src/api/expenses";
import { useAuthStore } from "../../../src/store/authStore";
import { colors, spacing, typography } from "../../../src/theme/colors";
import {
  formatINR,
  formatDate,
  formatDateTime,
  formatDeadlineStatus,
  getExpenseStatusBadge,
} from "../../../src/utils/formatters";
import { Header } from "../../../src/components/common/Header";
import { Badge } from "../../../src/components/common/Badge";
import { Button } from "../../../src/components/common/Button";
import { ExpenseSplitRow } from "../../../src/components/expense/ExpenseSplitRow";
import { ReceiptModal } from "../../../src/components/expense/ReceiptModal";
import { ConfirmModal } from "../../../src/components/common/ConfirmModal";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { EmptyState } from "../../../src/components/common/EmptyState";

export default function ExpenseDetailScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);

  const {
    data: expense,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["expenseDetail", expenseId],
    queryFn: () => getExpenseDetail(expenseId),
    enabled: !!expenseId,
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });

  // Close expense mutation (only allowed for Expense Leader when READY_TO_CLOSE)
  const closeMutation = useMutation({
    mutationFn: () => closeExpense(expenseId),
    onSuccess: () => {
      setCloseModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ["expenseDetail", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      Alert.alert("Success", "Expense successfully closed and marked as fully settled!");
    },
    onError: (err: any) => {
      setCloseModalVisible(false);
      Alert.alert(
        "Could Not Close",
        err?.response?.data?.message || err?.message || "All member splits must be PAID before closing."
      );
    },
  });

  if (isLoading && !expense) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Expense Details"
          showBack
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/expenses" as any);
            }
          }}
        />
        <LoadingState message="Loading expense details..." fullScreen />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Expense Not Found"
          showBack
          onBack={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/expenses" as any);
            }
          }}
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Expense Not Found"
          description="Could not find this expense."
          actionTitle="Back"
          onAction={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/expenses" as any);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  const isExpenseLeader = currentUserId === expense.created_by;
  const statusBadge = getExpenseStatusBadge(expense.status);
  const deadlineInfo = formatDeadlineStatus(expense.current_deadline);

  // Check if current user has an unpaid split
  const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
  const canPay = mySplit && (mySplit.status === "PENDING" || mySplit.status === "REJECTED");

  // Check if there are submitted payments waiting for leader review
  const hasSubmissionsToReview =
    isExpenseLeader && expense.splits?.some((s) => s.status === "PAYMENT_SUBMITTED");

  // Can close only if Expense Leader and status is READY_TO_CLOSE (or all splits are PAID)
  const canClose =
    isExpenseLeader &&
    expense.status !== "CLOSED" &&
    expense.splits?.every((s) => s.status === "PAID");

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={expense.description}
        subtitle={expense.category || "Expense Details"}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/expenses" as any);
          }
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Main Amount Card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.amountLabel}>Total Bill Amount</Text>
              <Text style={styles.amountValue}>{formatINR(expense.amount)}</Text>
            </View>
            <Badge label={statusBadge.label} color={statusBadge.color} bg={statusBadge.bg} />
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Paid By</Text>
              <Text style={styles.metaValue}>
                {expense.creator?.name || "Expense Leader"}
                {isExpenseLeader ? " (You)" : ""}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(expense.created_at)}</Text>
            </View>
          </View>

          {/* Deadline reminder info */}
          <View style={styles.deadlineInfoRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={deadlineInfo.isOverdue ? colors.warning : colors.textMuted}
            />
            <Text
              style={[
                styles.deadlineInfoText,
                deadlineInfo.isOverdue && { color: colors.warning },
              ]}
            >
              Deadline: {formatDateTime(expense.current_deadline)} ({deadlineInfo.label})
            </Text>
          </View>

          {/* Receipt Preview Thumbnail Card */}
          {expense.receipt_url && (
            <TouchableOpacity
              style={styles.receiptPreviewContainer}
              onPress={() => setReceiptVisible(true)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: expense.receipt_url }} style={styles.receiptPreviewImage} />
              <View style={styles.receiptPreviewMeta}>
                <View style={styles.receiptPreviewBadge}>
                  <Ionicons name="receipt" size={14} color={colors.primary} />
                  <Text style={styles.receiptPreviewBadgeText}>Attached Bill Receipt</Text>
                </View>
                <Text style={styles.receiptPreviewTapHint}>Tap to view full receipt image</Text>
              </View>
              <Ionicons name="expand-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Expense Leader / Action Toolbar */}
        {isExpenseLeader && (
          <View style={styles.leaderBanner}>
            <View style={styles.leaderBannerLeft}>
              <Ionicons name="star" size={18} color={colors.primary} />
              <View>
                <Text style={styles.leaderBannerTitle}>You are the Expense Leader</Text>
                <Text style={styles.leaderBannerSub}>
                  You paid the original bill and manage reviews for this expense.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Primary Action Buttons */}
        {canPay && (
          <View style={styles.actionSection}>
            <Button
              title={`Pay Your Share (${formatINR(mySplit.amount)})`}
              icon={<Ionicons name="card-outline" size={18} color={colors.textInverse} />}
              onPress={() => router.push(`/expenses/${expense.id}/payment` as any)}
              variant="primary"
            />
          </View>
        )}

        {/* Member Pending Review Status Banner */}
        {mySplit?.status === "PAYMENT_SUBMITTED" && !isExpenseLeader && (
          <View style={styles.mySubmittedBanner}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mySubmittedTitle}>Payment Pending Review</Text>
              <Text style={styles.mySubmittedSub}>
                You submitted confirmation for {formatINR(mySplit.amount)}. Waiting for {expense.creator?.name || "Expense Leader"} to verify and accept.
              </Text>
            </View>
          </View>
        )}

        {/* Member Paid Status Banner */}
        {mySplit?.status === "PAID" && !isExpenseLeader && (
          <View style={styles.myPaidBanner}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.myPaidTitle}>Your Share Settled</Text>
              <Text style={styles.myPaidSub}>
                Your payment of {formatINR(mySplit.amount)} has been approved and marked as paid.
              </Text>
            </View>
          </View>
        )}

        {hasSubmissionsToReview && (
          <View style={styles.actionSection}>
            <Button
              title={`Review Submitted Payments (${
                expense.splits?.filter((s) => s.status === "PAYMENT_SUBMITTED").length || 0
              })`}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.textInverse} />}
              onPress={() => router.push(`/expenses/${expense.id}/review` as any)}
              variant="secondary"
            />
          </View>
        )}

        {canClose && (
          <View style={styles.actionSection}>
            <Button
              title="Close Expense (All Paid)"
              icon={<Ionicons name="checkmark-done" size={18} color={colors.textInverse} />}
              onPress={() => setCloseModalVisible(true)}
              variant="primary"
            />
          </View>
        )}

        {/* Splits Participants Breakdown */}
        <View style={styles.splitsCard}>
          <Text style={styles.splitsTitle}>
            Participants ({expense.splits?.length || 0})
          </Text>

          {expense.splits?.map((split) => (
            <ExpenseSplitRow
              key={split.id}
              split={split}
              isExpenseLeader={isExpenseLeader}
              isCurrentUser={split.user_id === currentUserId}
              onPay={() => router.push(`/expenses/${expense.id}/payment` as any)}
              onReview={() => router.push(`/expenses/${expense.id}/review` as any)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Receipt Viewer Modal */}
      <ReceiptModal
        visible={receiptVisible}
        imageUrl={expense.receipt_url}
        onClose={() => setReceiptVisible(false)}
      />

      {/* Close Expense Confirmation */}
      <ConfirmModal
        visible={closeModalVisible}
        title="Close Expense"
        message="All payments for this expense have been accepted. Are you ready to close it? Receipt images will be removed after the 2-day retention period."
        confirmText="Close Expense"
        confirmVariant="primary"
        loading={closeMutation.isPending}
        onConfirm={() => closeMutation.mutate()}
        onCancel={() => setCloseModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountValue: {
    ...typography.amount,
    color: colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 2,
  },
  deadlineInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  deadlineInfoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  receiptPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  receiptPreviewImage: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  receiptPreviewMeta: {
    flex: 1,
  },
  receiptPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  receiptPreviewBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  receiptPreviewTapHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  leaderBanner: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  leaderBannerLeft: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  leaderBannerTitle: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  leaderBannerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  actionSection: {
    marginBottom: spacing.md,
  },
  splitsCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  splitsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  mySubmittedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mySubmittedTitle: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  mySubmittedSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  myPaidBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  myPaidTitle: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  myPaidSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
