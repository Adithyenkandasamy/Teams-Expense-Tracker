import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getExpenseDetail } from "../../../src/api/expenses";
import { approvePayment, rejectPayment } from "../../../src/api/splits";
import { useAuthStore } from "../../../src/store/authStore";
import { colors, spacing, typography } from "../../../src/theme/colors";
import { formatINR, formatDateTime } from "../../../src/utils/formatters";
import { Header } from "../../../src/components/common/Header";
import { Avatar } from "../../../src/components/common/Avatar";
import { Button } from "../../../src/components/common/Button";
import { ConfirmModal } from "../../../src/components/common/ConfirmModal";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { EmptyState } from "../../../src/components/common/EmptyState";
import { ReceiptModal } from "../../../src/components/expense/ReceiptModal";
import { ExpenseSplit } from "../../../src/types/models";

export default function PaymentReviewScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [selectedSplit, setSelectedSplit] = useState<ExpenseSplit | null>(null);
  const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  const { data: expense, isLoading, refetch } = useQuery({
    queryKey: ["expenseDetail", expenseId],
    queryFn: () => getExpenseDetail(expenseId),
    enabled: !!expenseId,
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });

  const approveMutation = useMutation({
    mutationFn: (splitId: string) => approvePayment(splitId),
    onSuccess: async (_, splitId) => {
      setModalType(null);
      setSelectedSplit(null);

      // Optimistically update query data to remove the split immediately
      queryClient.setQueryData(["expenseDetail", expenseId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          splits: old.splits?.map((s: any) =>
            s.id === splitId
              ? { ...s, status: "PAID", paid_at: new Date().toISOString() }
              : s
          ),
        };
      });

      await queryClient.refetchQueries({ queryKey: ["expenseDetail", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances"] });

      if (Platform.OS !== "web") {
        Alert.alert("Approved", "Payment has been accepted and marked as PAID.");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to approve payment";
      if (Platform.OS === "web") {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (splitId: string) => rejectPayment(splitId),
    onSuccess: async (_, splitId) => {
      setModalType(null);
      setSelectedSplit(null);

      // Optimistically update query data
      queryClient.setQueryData(["expenseDetail", expenseId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          splits: old.splits?.map((s: any) =>
            s.id === splitId
              ? { ...s, status: "REJECTED", payment_submitted_at: null }
              : s
          ),
        };
      });

      await queryClient.refetchQueries({ queryKey: ["expenseDetail", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances"] });

      if (Platform.OS !== "web") {
        Alert.alert("Rejected", "Payment has been rejected. The user has been notified to re-submit.");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to reject payment";
      if (Platform.OS === "web") {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  if (isLoading && !expense) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Payment Review" showBack onBack={() => router.back()} />
        <LoadingState message="Loading submissions..." fullScreen />
      </SafeAreaView>
    );
  }

  // Security & rule enforcement: Only Expense Leader of this expense can access
  if (expense && expense.created_by !== currentUserId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Unauthorized" showBack onBack={() => router.back()} />
        <EmptyState
          icon="shield-outline"
          title="Access Restricted"
          description="Only the Expense Leader who paid the original bill can review submitted payments."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const submittedSplits = expense?.splits?.filter((s) => s.status === "PAYMENT_SUBMITTED") || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Review Payments"
        subtitle={expense?.description}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(`/expenses/${expenseId}` as any);
          }
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Live Auto-Refresh Bar */}
        <View style={styles.liveBar}>
          <View style={styles.liveIndicator}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>Live Auto-Refresh Active</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={14} color={colors.primary} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoBannerText}>
            Verify that money was credited into your bank or UPI account before approving.
          </Text>
        </View>

        {submittedSplits.length === 0 ? (
          <EmptyState
            icon="checkmark-done-circle-outline"
            title="All Caught Up!"
            description="There are no pending payment submissions awaiting your approval. Any new submissions appear here automatically."
            actionTitle="Return to Expense"
            onAction={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/expenses/${expenseId}` as any);
              }
            }}
          />
        ) : (
          submittedSplits.map((split) => {
            const userName = split.user?.name || "Member";
            const userEmail = split.user?.email || "";
            const proof = split.payment_proofs?.[0]?.image_url;

            return (
              <View key={split.id} style={styles.submissionCard}>
                <View style={styles.userRow}>
                  <Avatar name={userName} imageUrl={split.user?.profile_image} size={48} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userName}</Text>
                    {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
                    <Text style={styles.submittedTime}>
                      Submitted: {formatDateTime(split.payment_submitted_at || split.updated_at)}
                    </Text>
                  </View>
                  <Text style={styles.amountText}>{formatINR(split.amount)}</Text>
                </View>

                {/* Proof preview if attached */}
                {proof ? (
                  <TouchableOpacity
                    style={styles.proofPreviewRow}
                    onPress={() => setProofModalUrl(proof)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: proof }} style={styles.proofImageThumb} />
                    <View style={styles.proofTextCol}>
                      <Text style={styles.proofTitle}>Payment Proof Attached</Text>
                      <Text style={styles.proofSubtitle}>Tap to inspect full screenshot</Text>
                    </View>
                    <Ionicons name="expand-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noProofRow}>
                    <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.noProofText}>No payment screenshot uploaded</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <View style={styles.btnCol}>
                    <Button
                      title="Reject"
                      variant="danger"
                      size="small"
                      onPress={() => {
                        setSelectedSplit(split);
                        setModalType("REJECT");
                      }}
                    />
                  </View>
                  <View style={styles.btnCol}>
                    <Button
                      title="Accept Payment"
                      variant="primary"
                      size="small"
                      onPress={() => {
                        setSelectedSplit(split);
                        setModalType("APPROVE");
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Proof Viewer Modal */}
      <ReceiptModal
        visible={!!proofModalUrl}
        imageUrl={proofModalUrl}
        onClose={() => setProofModalUrl(null)}
      />

      {/* Confirmation Modals */}
      <ConfirmModal
        visible={modalType === "APPROVE"}
        title="Accept Payment"
        message={`Confirm that you received ${formatINR(selectedSplit?.amount)} from ${
          selectedSplit?.user?.name || "this member"
        }?`}
        confirmText="Confirm & Accept"
        confirmVariant="primary"
        loading={approveMutation.isPending}
        onConfirm={() => selectedSplit && approveMutation.mutate(selectedSplit.id)}
        onCancel={() => setModalType(null)}
      />

      <ConfirmModal
        visible={modalType === "REJECT"}
        title="Reject Payment"
        message={`Are you sure you want to reject this payment submission from ${
          selectedSplit?.user?.name || "this member"
        }? They will be notified to submit again.`}
        confirmText="Reject Payment"
        confirmVariant="danger"
        loading={rejectMutation.isPending}
        onConfirm={() => selectedSplit && rejectMutation.mutate(selectedSplit.id)}
        onCancel={() => setModalType(null)}
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
  infoBanner: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  submissionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  submittedTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  amountText: {
    ...typography.amount,
    color: colors.primary,
  },
  proofPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  proofImageThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  proofTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  proofTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  proofSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  noProofRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: spacing.md,
  },
  noProofText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  btnCol: {
    flex: 1,
  },
  liveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
  },
  refreshButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
