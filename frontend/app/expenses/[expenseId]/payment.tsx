import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getExpenseDetail } from "../../../src/api/expenses";
import { submitPayment } from "../../../src/api/splits";
import { useAuthStore } from "../../../src/store/authStore";
import { colors, spacing, typography } from "../../../src/theme/colors";
import { formatINR, formatDateTime } from "../../../src/utils/formatters";
import { launchUpiPayment } from "../../../src/utils/upi";
import { Header } from "../../../src/components/common/Header";
import { Button } from "../../../src/components/common/Button";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { Avatar } from "../../../src/components/common/Avatar";

export default function PaymentScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [proofImage, setProofImage] = useState<string | null>(null);
  const [upiOpened, setUpiOpened] = useState(false);

  const { data: expense, isLoading, refetch } = useQuery({
    queryKey: ["expenseDetail", expenseId],
    queryFn: () => getExpenseDetail(expenseId),
    enabled: !!expenseId,
    refetchInterval: 3000,
  });

  const mySplit = expense?.splits?.find((s) => s.user_id === currentUserId);
  const leader = expense?.creator;

  const isSubmitted = mySplit?.status === "PAYMENT_SUBMITTED";
  const isPaid = mySplit?.status === "PAID";

  // Submit payment confirmation mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!mySplit?.id) throw new Error("No pending split found");
      return await submitPayment(mySplit.id, proofImage || undefined);
    },
    onSuccess: async () => {
      queryClient.setQueryData(["expenseDetail", expenseId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          splits: old.splits?.map((s: any) =>
            s.id === mySplit?.id
              ? {
                  ...s,
                  status: "PAYMENT_SUBMITTED",
                  payment_submitted_at: new Date().toISOString(),
                }
              : s
          ),
        };
      });
      await queryClient.refetchQueries({ queryKey: ["expenseDetail", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupExpenses"] });

      if (Platform.OS === "web") {
        window.alert(
          "Payment Submitted!\nYour confirmation was sent to the Expense Leader for approval."
        );
        router.replace(`/expenses/${expenseId}` as any);
      } else {
        Alert.alert(
          "Payment Submitted",
          "Your payment confirmation has been submitted to the Expense Leader for approval.",
          [
            {
              text: "Done",
              onPress: () => router.replace(`/expenses/${expenseId}` as any),
            },
          ]
        );
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "";
      if (
        msg.includes("PAYMENT_SUBMITTED") ||
        msg.includes("PAID") ||
        msg.includes("Cannot submit payment")
      ) {
        queryClient.invalidateQueries({ queryKey: ["expenseDetail", expenseId] });
        if (Platform.OS === "web") {
          window.alert(
            "Already Submitted!\nThis payment confirmation was already submitted and is awaiting leader approval."
          );
          router.replace(`/expenses/${expenseId}` as any);
        } else {
          Alert.alert(
            "Already Submitted",
            "This payment confirmation was already submitted and is awaiting leader approval.",
            [
              {
                text: "View Expense",
                onPress: () => router.replace(`/expenses/${expenseId}` as any),
              },
            ]
          );
        }
        return;
      }
      if (Platform.OS === "web") {
        window.alert(`Submission Error\n${msg || "Failed to submit payment confirmation."}`);
      } else {
        Alert.alert(
          "Submission Error",
          msg || "Failed to submit payment confirmation."
        );
      }
    },
  });

  const handleLaunchUpi = async () => {
    if (!mySplit || !leader) return;

    if (!leader.upi_id) {
      Alert.alert(
        "No UPI ID Configured",
        `${leader.name} has not set up a UPI ID yet. You can pay them directly and upload the screenshot/proof below.`
      );
      setUpiOpened(true);
      return;
    }

    const success = await launchUpiPayment({
      upiId: leader.upi_id,
      payeeName: leader.name,
      amount: mySplit.amount,
      transactionNote: `Settlement for ${expense?.description}`,
    });

    setUpiOpened(true);

    if (!success) {
      Alert.alert(
        "UPI Apps",
        `Could not open UPI app automatically. You can manually pay ${leader.name} at: ${leader.upi_id}`
      );
    }
  };

  const handlePickProof = async () => {
    Alert.alert("Payment Proof", "Choose screenshot or photo of payment confirmation", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") return;
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          if (!res.canceled && res.assets[0]) {
            setProofImage(res.assets[0].uri);
          }
        },
      },
      {
        text: "Gallery / Screenshot",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!res.canceled && res.assets[0]) {
            setProofImage(res.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (isLoading || !expense || !mySplit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Settle Share" showBack onBack={() => router.back()} />
        <LoadingState message="Loading payment details..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Settle Share"
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Payment Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>{formatINR(mySplit.amount)}</Text>
          <Text style={styles.forExpense}>For: {expense.description}</Text>
        </View>

        {/* Expense Leader Card */}
        <View style={styles.leaderCard}>
          <Text style={styles.cardHeader}>Pay To (Expense Leader)</Text>
          <View style={styles.leaderRow}>
            <Avatar name={leader?.name || "Leader"} imageUrl={leader?.profile_image} size={48} />
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{leader?.name}</Text>
              <Text style={styles.upiIdText}>
                {leader?.upi_id ? `UPI: ${leader.upi_id}` : "No UPI ID listed"}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status Alerts */}
        {isSubmitted && (
          <View style={styles.statusBannerSubmitted}>
            <Ionicons name="time" size={24} color={colors.warning} />
            <View style={styles.statusBannerTextContainer}>
              <Text style={styles.statusBannerTitle}>Payment Submitted & Pending Review</Text>
              <Text style={styles.statusBannerSub}>
                Your payment confirmation was recorded. The Expense Leader ({leader?.name || "Leader"}) has been notified to verify and accept it.
              </Text>
            </View>
          </View>
        )}

        {isPaid && (
          <View style={styles.statusBannerPaid}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={styles.statusBannerTextContainer}>
              <Text style={styles.statusBannerTitle}>Payment Verified & Settled!</Text>
              <Text style={styles.statusBannerSub}>
                Your share of {formatINR(mySplit.amount)} has been approved by {leader?.name || "Leader"}.
              </Text>
            </View>
          </View>
        )}

        {/* UPI Payment Trigger (Hidden if already submitted or paid) */}
        {!isSubmitted && !isPaid && (
          <View style={styles.section}>
            <Button
              title="Pay with UPI"
              icon={<Ionicons name="flash-outline" size={20} color={colors.textInverse} />}
              onPress={handleLaunchUpi}
              variant="primary"
            />

            <View style={styles.noticeBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.noticeText}>
                IMPORTANT: Opening UPI does NOT automatically mark the expense as paid.
                After completing the transfer, submit your confirmation below so the Expense Leader can verify it.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Proof Section (Hidden if already submitted or paid) */}
        {!isSubmitted && !isPaid && (
          <View style={styles.section}>
            <Text style={styles.cardHeader}>Payment Proof (Optional)</Text>
            {proofImage ? (
              <View style={styles.proofPreview}>
                <Image source={{ uri: proofImage }} style={styles.proofImg} />
                <TouchableOpacity
                  style={styles.removeProofBtn}
                  onPress={() => setProofImage(null)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={styles.removeProofText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickProof}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={22} color={colors.primary} />
                <Text style={styles.uploadBtnText}>Upload Screenshot / Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Submit Confirmation Button */}
        <View style={styles.submitSection}>
          {isSubmitted ? (
            <View style={{ gap: spacing.md }}>
              <Button
                title="Submitted — Awaiting Approval"
                variant="secondary"
                disabled
                onPress={() => {}}
              />
              <Button
                title="Return to Expense"
                variant="outline"
                onPress={() => router.replace(`/expenses/${expenseId}` as any)}
              />
            </View>
          ) : isPaid ? (
            <View style={{ gap: spacing.md }}>
              <Button
                title="Payment Settled (Paid)"
                variant="primary"
                disabled
                onPress={() => {}}
              />
              <Button
                title="Return to Expense"
                variant="outline"
                onPress={() => router.replace(`/expenses/${expenseId}` as any)}
              />
            </View>
          ) : (
            <Button
              title="I Have Completed Payment"
              variant="secondary"
              loading={submitMutation.isPending}
              disabled={submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
            />
          )}
        </View>
      </ScrollView>
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
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountValue: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: "700",
    marginVertical: 4,
  },
  forExpense: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaderInfo: {
    marginLeft: spacing.md,
  },
  leaderName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  upiIdText: {
    ...typography.body2,
    color: colors.primary,
    marginTop: 2,
    fontWeight: "500",
  },
  section: {
    marginBottom: spacing.xl,
  },
  noticeBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
    lineHeight: 18,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.lg,
  },
  uploadBtnText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: "600",
  },
  proofPreview: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  proofImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  removeProofBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeProofText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "600",
  },
  submitSection: {
    marginTop: spacing.sm,
  },
  statusBannerSubmitted: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusBannerPaid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusBannerTextContainer: {
    flex: 1,
  },
  statusBannerTitle: {
    ...typography.body1,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBannerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
