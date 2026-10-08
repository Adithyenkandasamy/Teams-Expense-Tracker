import React, { useState, useMemo } from "react";
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
import { getGroups, getGroupMembers } from "../../src/api/groups";
import { createExpense, uploadReceipt } from "../../src/api/expenses";
import { useAuthStore } from "../../src/store/authStore";
import { colors, spacing, typography } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Header } from "../../src/components/common/Header";
import { Input } from "../../src/components/common/Input";
import { Button } from "../../src/components/common/Button";
import { Avatar } from "../../src/components/common/Avatar";

const CATEGORIES = ["Food & Drinks", "Groceries", "Rent", "Utilities", "Travel", "Entertainment", "Other"];

export default function CreateExpenseScreen() {
  const { groupId: initialGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Groups list
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || (groups[0]?.id || "")
  );

  // Group members for the chosen group
  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", selectedGroupId],
    queryFn: () => getGroupMembers(selectedGroupId),
    enabled: !!selectedGroupId,
  });

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [deadlineDays, setDeadlineDays] = useState(3);

  // Auto-select all members initially when members load
  React.useEffect(() => {
    if (members.length > 0) {
      setSelectedMemberIds(members.map((m) => m.user_id));
    }
  }, [members]);

  // Set default group if not set
  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);


  // Toggle member selection
  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length <= 1) {
        Alert.alert("Notice", "At least one member must be included in the split.");
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  // Split calculation preview
  const previewSplitAmount = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || selectedMemberIds.length === 0) return 0;
    return num / selectedMemberIds.length;
  }, [amount, selectedMemberIds]);

  // Receipt image picker
  const pickReceiptImage = async () => {
    Alert.alert("Attach Receipt", "Choose receipt photo from camera or library", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission", "Camera permission is required to photograph receipts.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setReceiptImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setReceiptImage(result.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

      const created = await createExpense(selectedGroupId, {
        amount: parseFloat(amount).toFixed(2),
        description: description.trim(),
        category,
        split_between: selectedMemberIds,
        deadline: deadlineDate.toISOString(),
      });

      // If receipt attached, upload it through backend/Cloudinary flow
      if (receiptImage) {
        try {
          const updated = await uploadReceipt(created.id, receiptImage);
          if (updated?.receipt_url) {
            created.receipt_url = updated.receipt_url;
          }
        } catch (uploadErr) {
          console.warn("Receipt upload error:", uploadErr);
        }
      }

      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["groupExpenses", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["groupBalances", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["expenseDetail", created.id] });

      if (Platform.OS === "web") {
        router.replace(`/expenses/${created.id}` as any);
      } else {
        Alert.alert("Success", "Expense created successfully!", [
          {
            text: "View Expense",
            onPress: () => router.replace(`/expenses/${created.id}` as any),
          },
        ]);
      }
    },
    onError: (err: any) => {
      Alert.alert(
        "Creation Error",
        err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Could not create expense."
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedGroupId) {
      Alert.alert("Validation", "Please select a group.");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Validation", "Please enter a valid positive amount.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation", "Please enter a description for the expense.");
      return;
    }
    if (selectedMemberIds.length === 0) {
      Alert.alert("Validation", "Please select at least one member to split with.");
      return;
    }

    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Add Expense"
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Creator Notice (Business rule: creator == payer == Expense Leader) */}
        <View style={styles.leaderNotice}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.leaderNoticeText}>
            You will be recorded as having paid the full bill and will be the{" "}
            <Text style={{ fontWeight: "700", color: colors.primary }}>
              Expense Leader
            </Text>{" "}
            for this expense.
          </Text>
        </View>

        {/* Group Selector */}
        {groups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.groupChip,
                    selectedGroupId === g.id && styles.groupChipActive,
                  ]}
                  onPress={() => setSelectedGroupId(g.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.groupChipText,
                      selectedGroupId === g.id && styles.groupChipTextActive,
                    ]}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}


        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Bill Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInputField}
            />
          </View>
        </View>

        {/* Description & Category */}
        <View style={styles.section}>
          <Input
            label="Expense Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Weekly Groceries, Pizza Night, WiFi"
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reminder Deadline */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Reminder Deadline</Text>
          <View style={styles.deadlineRow}>
            {[1, 3, 5, 7].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.deadlineChip,
                  deadlineDays === days && styles.deadlineChipActive,
                ]}
                onPress={() => setDeadlineDays(days)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.deadlineChipText,
                    deadlineDays === days && styles.deadlineChipTextActive,
                  ]}
                >
                  {days} {days === 1 ? "day" : "days"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>
            Deadlines act as reminder triggers and auto-extend if unpaid.
          </Text>
        </View>

        {/* Receipt Attachment */}
        <View style={styles.section}>
          <Text style={styles.label}>Attach Receipt Image (Optional)</Text>
          {receiptImage ? (
            <View style={styles.receiptPreviewCard}>
              <Image source={{ uri: receiptImage }} style={styles.receiptThumb} />
              <TouchableOpacity
                style={styles.removeReceiptBtn}
                onPress={() => setReceiptImage(null)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.removeReceiptText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadReceiptBtn}
              onPress={pickReceiptImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.uploadReceiptText}>Take photo or upload bill</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Member Split Selection & Preview */}
        <View style={styles.section}>
          <Text style={styles.label}>Split Between Members ({selectedMemberIds.length})</Text>
          <Text style={styles.helperText}>
            Select all participants who share this cost (including you).
          </Text>

          <View style={styles.membersList}>
            {members.map((m) => {
              const isSelected = selectedMemberIds.includes(m.user_id);
              const isYou = m.user_id === currentUser?.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                  onPress={() => toggleMember(m.user_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberLeft}>
                    <Avatar name={m.user?.name || "Member"} imageUrl={m.user?.profile_image} size={38} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {m.user?.name} {isYou ? "(You)" : ""}
                      </Text>
                      {isSelected && previewSplitAmount > 0 && (
                        <Text style={styles.memberSplitAmount}>
                          Share: {formatINR(previewSplitAmount)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Ionicons
                    name={isSelected ? "checkbox" : "square-outline"}
                    size={22}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Split Preview Summary Card */}
        {previewSplitAmount > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Split Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Amount:</Text>
              <Text style={styles.previewValue}>{formatINR(amount)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Each Person Owes:</Text>
              <Text style={[styles.previewValue, { color: colors.primary }]}>
                {formatINR(previewSplitAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitWrapper}>
          <Button
            title="Create Expense"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            variant="primary"
          />
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
  leaderNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  leaderNoticeText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    ...typography.h1,
    color: colors.primary,
    marginRight: 6,
  },
  amountInputField: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 140,
    textAlign: "center",
  },
  label: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  chipsScroll: {
    flexDirection: "row",
  },
  groupChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  groupChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  groupChipText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  groupChipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  categoryChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  deadlineRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  deadlineChip: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deadlineChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  deadlineChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deadlineChipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  uploadReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing.lg,
  },
  uploadReceiptText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: "600",
  },
  receiptPreviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  receiptThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: spacing.sm,
  },
  removeReceiptText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: "600",
  },
  membersList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  memberItemSelected: {
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  memberName: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  memberSplitAmount: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xl,
  },
  previewTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
  },
  previewLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  previewValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  submitWrapper: {
    marginTop: spacing.md,
  },
});
