import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "../../src/components/common/Header";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import {
  createSavingsTarget,
  getSavingsTargetSummary,
  deleteSavingsTarget,
  getSavingsTargets,
  updateSavingsTarget,
} from "../../src/api/savingsTargets";
import { useAuthStore } from "../../src/store/authStore";
import { FadeInView } from "../../src/components/animated";
import {
  SavingsTargetCard,
  RecessedInput,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  ConfirmationDialog,
  RaisedIconContainer,
} from "../../src/components/skeuomorphic";

export default function TargetsScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const {
    data: goals = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["savingsTargets"],
    queryFn: getSavingsTargets,
    enabled: !!user,
    retry: 1,
  });
  const { data: summary } = useQuery({
    queryKey: ["savingsTargets", "summary"],
    queryFn: getSavingsTargetSummary,
    enabled: !!user,
    retry: 1,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [isUpdatingSavedOnly, setIsUpdatingSavedOnly] = useState(false);
  const [deleteConfirmTargetId, setDeleteConfirmTargetId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("0");

  const createMutation = useMutation({
    mutationFn: createSavingsTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsTargets"] });
      queryClient.invalidateQueries({ queryKey: ["savingsTargets", "summary"] });
      closeModal();
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Could not create target.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; target_amount?: number; saved_amount: number };
    }) => updateSavingsTarget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsTargets"] });
      queryClient.invalidateQueries({ queryKey: ["savingsTargets", "summary"] });
      closeModal();
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Could not update target.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsTargets"] });
      queryClient.invalidateQueries({ queryKey: ["savingsTargets", "summary"] });
      setDeleteConfirmTargetId(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Could not delete target.");
    },
  });

  const closeModal = () => {
    setModalVisible(false);
    setEditingTargetId(null);
    setIsUpdatingSavedOnly(false);
    setName("");
    setTargetAmount("");
    setSavedAmount("0");
  };

  const handleOpenCreate = () => {
    setEditingTargetId(null);
    setIsUpdatingSavedOnly(false);
    setName("");
    setTargetAmount("");
    setSavedAmount("0");
    setModalVisible(true);
  };

  const handleOpenEdit = (goal: (typeof goals)[number]) => {
    setEditingTargetId(goal.id);
    setIsUpdatingSavedOnly(false);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setSavedAmount(String(goal.saved_amount));
    setModalVisible(true);
  };

  const handleOpenUpdateSaved = (goal: (typeof goals)[number]) => {
    setEditingTargetId(goal.id);
    setIsUpdatingSavedOnly(true);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setSavedAmount(String(goal.saved_amount));
    setModalVisible(true);
  };

  const handleSave = () => {
    const targetNum = Number(targetAmount);
    const savedNum = Number(savedAmount) || 0;

    if (isUpdatingSavedOnly && editingTargetId) {
      if (!Number.isFinite(savedNum) || savedNum < 0) {
        Alert.alert("Validation", "Please enter a valid saved amount.");
        return;
      }
      updateMutation.mutate({
        id: editingTargetId,
        payload: { saved_amount: savedNum },
      });
      return;
    }

    if (!name.trim()) {
      Alert.alert("Validation", "Please enter what you are saving for.");
      return;
    }
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      Alert.alert("Validation", "Please enter a target amount greater than zero.");
      return;
    }

    if (editingTargetId) {
      updateMutation.mutate({
        id: editingTargetId,
        payload: {
          name: name.trim(),
          target_amount: targetNum,
          saved_amount: savedNum,
        },
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        target_amount: targetNum,
        saved_amount: savedNum,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Savings Targets"
        subtitle="Plan and fund future milestones"
        rightAction={
          <TouchableOpacity
            onPress={handleOpenCreate}
            style={styles.newTargetBtn}
            activeOpacity={0.8}
          >
            <RaisedIconContainer size={32} variant="raised">
              <Ionicons name="add" size={20} color={colors.primary} />
            </RaisedIconContainer>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>YOUR SAVINGS</Text>
            <Text style={styles.summaryAmount}>
              ₹{Number(summary.total_saved).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.summaryLabel}>
              Across {summary.active_targets} active target{summary.active_targets === 1 ? "" : "s"}
            </Text>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryLabel}>
                {summary.completed_targets} completed
              </Text>
              <Text style={styles.summaryRemaining}>
                ₹{Number(summary.total_remaining).toLocaleString("en-IN", { minimumFractionDigits: 2 })} remaining
              </Text>
            </View>
          </View>
        ) : null}
        {/* Intro Banner */}
        <FadeInView delay={0}>
          <View style={styles.introCard}>
            <View style={styles.introTopBevel} pointerEvents="none" />
            <View style={styles.introHeader}>
              <Ionicons name="flag" size={15} color={colors.primary} />
              <Text style={styles.introEyebrow}>FINANCIAL GOALS</Text>
            </View>
            <Text style={styles.introTitle}>
              Track what you’ve saved toward purchases, emergency funds, or trips.
            </Text>
          </View>
        </FadeInView>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : isError ? (
          <ErrorState
            message="Could not load your savings targets."
            onRetry={refetch}
          />
        ) : goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No Targets Set"
            description="Create a savings target to see your progress meters update in real-time."
            actionTitle="Create First Target"
            onAction={handleOpenCreate}
          />
        ) : (
          goals.map((goal, index) => (
            <FadeInView key={goal.id} delay={index * 50}>
              <SavingsTargetCard
                target={goal}
                onUpdateSaved={() => handleOpenUpdateSaved(goal)}
                onEdit={() => handleOpenEdit(goal)}
                onDelete={() => setDeleteConfirmTargetId(goal.id)}
              />
            </FadeInView>
          ))
        )}
      </ScrollView>

      {/* Create / Edit / Update Saved Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopBevel} pointerEvents="none" />

            <Text style={styles.modalTitle}>
              {isUpdatingSavedOnly
                ? "Update Saved Amount"
                : editingTargetId
                ? "Edit Savings Target"
                : "Create Savings Target"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isUpdatingSavedOnly
                ? `Update how much you have saved so far for "${name}".`
                : "Set a clear financial goal to keep your spending intentional."}
            </Text>

            {!isUpdatingSavedOnly && (
              <RecessedInput
                label="Target Name"
                placeholder="e.g. New Laptop, Vacation, Rent Reserve"
                value={name}
                onChangeText={setName}
                leadingIcon="flag-outline"
              />
            )}

            {!isUpdatingSavedOnly && (
              <RecessedInput
                label="Target Amount (₹)"
                placeholder="e.g. 50000"
                keyboardType="decimal-pad"
                value={targetAmount}
                onChangeText={setTargetAmount}
                leadingIcon="cash-outline"
              />
            )}

            <RecessedInput
              label={isUpdatingSavedOnly ? "Current Saved Total (₹)" : "Already Saved (₹)"}
              placeholder="0"
              keyboardType="decimal-pad"
              value={savedAmount}
              onChangeText={setSavedAmount}
              leadingIcon="wallet-outline"
            />

            <View style={styles.modalActions}>
              <SecondaryButton
                title="Cancel"
                onPress={closeModal}
                disabled={isSaving}
                size="medium"
                style={styles.modalBtn}
              />
              <PrimaryButton
                title={isSaving ? "Saving..." : isUpdatingSavedOnly ? "Update Total" : "Save Target"}
                onPress={handleSave}
                loading={isSaving}
                size="medium"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog for Deleting Target */}
      <ConfirmationDialog
        visible={!!deleteConfirmTargetId}
        title="Delete Savings Target?"
        message="This savings goal will be removed. Your saved balance figures won't be altered."
        confirmText="Delete Target"
        isDestructive
        onCancel={() => setDeleteConfirmTargetId(null)}
        onConfirm={() => {
          if (deleteConfirmTargetId) {
            deleteMutation.mutate(deleteConfirmTargetId);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  newTargetBtn: {
    padding: 2,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  summaryEyebrow: {
    ...typography.caption,
    color: colors.textInverse,
    opacity: 0.8,
    letterSpacing: 1,
    fontWeight: "700",
  },
  summaryAmount: {
    ...typography.amount,
    color: colors.textInverse,
    fontSize: 28,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textInverse,
    opacity: 0.85,
  },
  summaryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
  },
  summaryRemaining: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "700",
  },
  introTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  introEyebrow: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.8,
  },
  introTitle: {
    ...typography.body2,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.xl,
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22)",
        }
      : {}),
  },
  modalTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
