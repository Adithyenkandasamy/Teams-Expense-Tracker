import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getGroups, getGroupMembers } from "../../src/api/groups";
import { createExpense, uploadReceipt } from "../../src/api/expenses";
import { createPersonalExpense } from "../../src/api/personalExpenses";
import { useAuthStore } from "../../src/store/authStore";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Header } from "../../src/components/common/Header";
import { Avatar } from "../../src/components/common/Avatar";
import { FadeInView } from "../../src/components/animated";
import {
  RecessedInput,
  PrimaryButton,
  SecondaryButton,
  CategoryButton,
  RaisedIconContainer,
  EmptyState,
} from "../../src/components/skeuomorphic";

const CATEGORIES = [
  "Food & Drinks",
  "Groceries",
  "Rent",
  "Utilities",
  "Travel",
  "Entertainment",
  "Other",
];

const DEADLINE_OPTIONS = [
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
];

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

  const [expenseScope, setExpenseScope] = useState<"PERSONAL" | "GROUP">(
    initialGroupId ? "GROUP" : "PERSONAL"
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || (groups[0]?.id || "")
  );
  const [groupSearch, setGroupSearch] = useState("");

  // Group members for the chosen group
  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", selectedGroupId],
    queryFn: () => getGroupMembers(selectedGroupId),
    enabled: !!selectedGroupId && expenseScope === "GROUP",
  });

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [deadlineDays, setDeadlineDays] = useState(7);

  // Field errors
  const [amountError, setAmountError] = useState("");
  const [descError, setDescError] = useState("");
  const [groupError, setGroupError] = useState("");

  // Success dialog state
  const [successData, setSuccessData] = useState<{
    amount: number;
    scope: "PERSONAL" | "GROUP";
    groupName?: string;
    splitPerPerson?: number;
    memberCount?: number;
    expenseId?: string;
  } | null>(null);

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
        Alert.alert("Notice", "At least one participant must be included in the split.");
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
    return Math.round((num / selectedMemberIds.length) * 100) / 100;
  }, [amount, selectedMemberIds]);

  // Receipt image picker
  const pickReceiptImage = async () => {
    Alert.alert("Attach Receipt", "Choose receipt photo source", [
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
      const parsedAmount = parseFloat(amount).toFixed(2);

      if (expenseScope === "PERSONAL") {
        return createPersonalExpense({
          amount: parsedAmount,
          description: description.trim(),
          category,
        });
      }

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

      const created = await createExpense(selectedGroupId, {
        amount: parsedAmount,
        description: description.trim(),
        category,
        split_between: selectedMemberIds,
        deadline: deadlineDate.toISOString(),
      });

      if (receiptImage && created?.id) {
        try {
          await uploadReceipt(created.id, receiptImage);
        } catch (uploadErr) {
          console.warn("Receipt upload error:", uploadErr);
        }
      }

      return created;
    },
    onSuccess: (created: any) => {
      const num = parseFloat(amount);
      const chosenGroup = groups.find((g) => g.id === selectedGroupId);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySpending"] });
      queryClient.invalidateQueries({ queryKey: ["personalExpenses"] });
      if (selectedGroupId) {
        queryClient.invalidateQueries({ queryKey: ["groupExpenses", selectedGroupId] });
        queryClient.invalidateQueries({ queryKey: ["groupBalances", selectedGroupId] });
      }

      setSuccessData({
        amount: num,
        scope: expenseScope,
        groupName: chosenGroup?.name,
        splitPerPerson: previewSplitAmount,
        memberCount: selectedMemberIds.length,
        expenseId: created?.id,
      });
    },
    onError: (err: any) => {
      Alert.alert(
        "Creation Error",
        err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Could not record expense."
      );
    },
  });

  const handleSubmit = () => {
    let hasError = false;
    setAmountError("");
    setDescError("");
    setGroupError("");

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setAmountError("Please enter a valid amount greater than ₹0.");
      hasError = true;
    }

    if (!description.trim()) {
      setDescError("Please enter what this expense was for.");
      hasError = true;
    }

    if (expenseScope === "GROUP") {
      if (!selectedGroupId) {
        setGroupError("Please select a group for this expense.");
        hasError = true;
      }
      if (selectedMemberIds.length === 0) {
        Alert.alert("Validation", "Please select at least one participant to split with.");
        hasError = true;
      }
    }

    if (hasError) return;

    createMutation.mutate();
  };

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
    );
  }, [groups, groupSearch]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Add Expense"
        subtitle="Log personal spend or split with team"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/home" as any);
          }
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scope Selection: Two tactile cards */}
        <FadeInView delay={0}>
          <Text style={styles.sectionHeaderLabel}>EXPENSE SCOPE</Text>
          <View style={styles.scopeCardsRow}>
            {/* My Expense Card */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setExpenseScope("PERSONAL")}
              style={[
                styles.scopeCard,
                styles.scopeCardFirst,
                expenseScope === "PERSONAL" ? styles.scopeCardActive : styles.scopeCardInactive,
              ]}
            >
              {expenseScope === "PERSONAL" && <View style={styles.cardSelectedBevel} pointerEvents="none" />}
              {expenseScope !== "PERSONAL" && <View style={styles.cardTopBevel} pointerEvents="none" />}

              <RaisedIconContainer
                size={40}
                variant={expenseScope === "PERSONAL" ? "recessed" : "raised"}
              >
                <Ionicons
                  name="person"
                  size={19}
                  color={expenseScope === "PERSONAL" ? colors.primary : colors.textSecondary}
                />
              </RaisedIconContainer>

              <View style={styles.scopeCardText}>
                <Text
                  style={[
                    styles.scopeTitle,
                    expenseScope === "PERSONAL" && styles.scopeTitleActive,
                  ]}
                >
                  My Expense
                </Text>
                <Text style={styles.scopeSub}>Personal Budget</Text>
              </View>

              {expenseScope === "PERSONAL" && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Group Expense Card */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setExpenseScope("GROUP")}
              style={[
                styles.scopeCard,
                expenseScope === "GROUP" ? styles.scopeCardActive : styles.scopeCardInactive,
              ]}
            >
              {expenseScope === "GROUP" && <View style={styles.cardSelectedBevel} pointerEvents="none" />}
              {expenseScope !== "GROUP" && <View style={styles.cardTopBevel} pointerEvents="none" />}

              <RaisedIconContainer
                size={40}
                variant={expenseScope === "GROUP" ? "recessed" : "raised"}
              >
                <Ionicons
                  name="people"
                  size={19}
                  color={expenseScope === "GROUP" ? colors.primary : colors.textSecondary}
                />
              </RaisedIconContainer>

              <View style={styles.scopeCardText}>
                <Text
                  style={[
                    styles.scopeTitle,
                    expenseScope === "GROUP" && styles.scopeTitleActive,
                  ]}
                >
                  Group Expense
                </Text>
                <Text style={styles.scopeSub}>Split with Members</Text>
              </View>

              {expenseScope === "GROUP" && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Large Amount Recessed Input Plate */}
        <FadeInView delay={60}>
          <View style={styles.amountCard}>
            <View style={styles.amountTopBevel} pointerEvents="none" />
            <Text style={styles.amountLabel}>AMOUNT SPENT</Text>

            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (amountError) setAmountError("");
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>

            {amountError ? (
              <Text style={styles.amountErrorText}>{amountError}</Text>
            ) : null}
          </View>
        </FadeInView>

        {/* Description & Category */}
        <FadeInView delay={120}>
          <View style={styles.formCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <RecessedInput
              label="Description / Merchant"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (descError) setDescError("");
              }}
              placeholder="e.g.Groceries, Electricity bill"
              leadingIcon="receipt-outline"
              error={descError}
            />

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.categoriesWrap}>
              {CATEGORIES.map((cat) => (
                <CategoryButton
                  key={cat}
                  category={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  size="compact"
                />
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Group Expense Fields (Exclusively in GROUP mode) */}
        {expenseScope === "GROUP" && (
          <FadeInView delay={180}>
            {/* Expense Leader Notice */}
            <View style={styles.leaderNoticeCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.leaderNoticeText}>
                You are paying this full bill upfront. Group members will be assigned their equal split to settle up with you.
              </Text>
            </View>

            {/* Group Picker */}
            <View style={styles.formCard}>
              <View style={styles.cardTopBevel} pointerEvents="none" />
              <Text style={styles.fieldLabel}>SELECT GROUP</Text>

              {groups.length > 3 && (
                <RecessedInput
                  placeholder="Filter groups..."
                  value={groupSearch}
                  onChangeText={setGroupSearch}
                  leadingIcon="search-outline"
                  onClear={() => setGroupSearch("")}
                />
              )}

              {filteredGroups.length === 0 ? (
                <Text style={styles.emptyHintText}>No matching groups found.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                  {filteredGroups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => {
                          setSelectedGroupId(g.id);
                          if (groupError) setGroupError("");
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.groupPill,
                          isSelected ? styles.groupPillSelected : styles.groupPillUnselected,
                        ]}
                      >
                        <Ionicons
                          name="people"
                          size={15}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <View>
                          <Text
                            style={[
                              styles.groupPillName,
                              isSelected && styles.groupPillNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {g.name}
                          </Text>
                          <Text style={styles.groupPillMembers}>
                            {g.members?.length || 0} members
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
              {groupError ? <Text style={styles.fieldErrorText}>{groupError}</Text> : null}

              {/* Participant Selection */}
              <View style={styles.participantsSection}>
                <View style={styles.participantHeaderRow}>
                  <Text style={styles.fieldLabel}>SPLIT PARTICIPANTS ({selectedMemberIds.length}/{members.length})</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedMemberIds(members.map((m) => m.user_id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.selectAllText}>Select All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.membersGrid}>
                  {members.map((member) => {
                    const isIncluded = selectedMemberIds.includes(member.user_id);
                    const isCurrent = member.user_id === currentUser?.id;

                    return (
                      <TouchableOpacity
                        key={member.user_id}
                        onPress={() => toggleMember(member.user_id)}
                        activeOpacity={0.8}
                        style={[
                          styles.memberChip,
                          isIncluded ? styles.memberChipIncluded : styles.memberChipExcluded,
                        ]}
                      >
                        <Avatar
                          name={member.user?.name || "Member"}
                          imageUrl={member.user?.profile_image}
                          size={26}
                        />
                        <Text
                          style={[
                            styles.memberName,
                            isIncluded && styles.memberNameIncluded,
                          ]}
                          numberOfLines={1}
                        >
                          {isCurrent ? "You" : member.user?.name || "Member"}
                        </Text>
                        <Ionicons
                          name={isIncluded ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={isIncluded ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Equal-Split Live Preview Plaque */}
              <View style={styles.splitPreviewPlaque}>
                <View style={styles.splitPreviewTop} pointerEvents="none" />
                <View style={styles.splitPreviewIcon}>
                  <Ionicons name="calculator-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.splitPreviewText}>
                  <Text style={styles.splitPreviewLabel}>EQUAL SPLIT PREVIEW</Text>
                  <Text style={styles.splitPreviewAmount}>
                    {formatINR(previewSplitAmount)}{" "}
                    <Text style={styles.splitPerPerson}>/ person</Text>
                  </Text>
                  <Text style={styles.splitSubtext}>
                    Across {selectedMemberIds.length} {selectedMemberIds.length === 1 ? "participant" : "participants"}
                  </Text>
                </View>
              </View>

              {/* Payment Reminder Deadline */}
              <View style={styles.deadlinesSection}>
                <Text style={styles.fieldLabel}>SETTLEMENT DEADLINE</Text>
                <View style={styles.deadlinesRow}>
                  {DEADLINE_OPTIONS.map((opt) => {
                    const isSelected = deadlineDays === opt.days;
                    return (
                      <TouchableOpacity
                        key={opt.days}
                        onPress={() => setDeadlineDays(opt.days)}
                        activeOpacity={0.8}
                        style={[
                          styles.deadlinePill,
                          isSelected && styles.deadlinePillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.deadlinePillText,
                            isSelected && styles.deadlinePillTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Receipt Attachment Section */}
        <FadeInView delay={220}>
          <View style={styles.formCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />
            <Text style={styles.fieldLabel}>RECEIPT PHOTO (OPTIONAL)</Text>

            {receiptImage ? (
              <View style={styles.receiptPreviewBox}>
                <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                <TouchableOpacity
                  onPress={() => setReceiptImage(null)}
                  style={styles.receiptRemoveBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={24} color={colors.negative} />
                </TouchableOpacity>
              </View>
            ) : (
              <SecondaryButton
                title="Attach Bill or Receipt"
                onPress={pickReceiptImage}
                icon={<Ionicons name="camera-outline" size={18} color={colors.primary} />}
                size="small"
              />
            )}
          </View>
        </FadeInView>

        {/* Submit Button */}
        <FadeInView delay={260} style={styles.submitSection}>
          <PrimaryButton
            title={createMutation.isPending ? "Recording Expense..." : "Save Expense"}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            size="large"
            icon={<Ionicons name="checkmark-done" size={20} color={colors.textInverse} />}
          />
        </FadeInView>
      </ScrollView>

      {/* Success Dialog */}
      <Modal
        visible={!!successData}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessData(null);
          router.replace("/(tabs)/home");
        }}
      >
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <RaisedIconContainer size={60} variant="raised" style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={34} color={colors.positive} />
            </RaisedIconContainer>

            <Text style={styles.successTitle}>Expense Recorded</Text>
            <Text style={styles.successAmount}>
              {formatINR(successData?.amount || 0)}
            </Text>

            <View style={styles.successDetailsCard}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Type:</Text>
                <Text style={styles.successDetailValue}>
                  {successData?.scope === "PERSONAL" ? "Personal Expense" : "Group Expense"}
                </Text>
              </View>

              {successData?.scope === "GROUP" && (
                <>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Group:</Text>
                    <Text style={styles.successDetailValue} numberOfLines={1}>
                      {successData?.groupName || "Group"}
                    </Text>
                  </View>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Equal Split:</Text>
                    <Text style={styles.successDetailValue}>
                      {formatINR(successData?.splitPerPerson || 0)} across {successData?.memberCount} members
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.successActions}>
              {successData?.scope === "GROUP" && successData.expenseId ? (
                <SecondaryButton
                  title="View Expense Details"
                  onPress={() => {
                    const id = successData.expenseId;
                    setSuccessData(null);
                    router.replace(`/expenses/${id}` as any);
                  }}
                  size="medium"
                  style={styles.successBtn}
                />
              ) : null}

              <PrimaryButton
                title="Done"
                onPress={() => {
                  setSuccessData(null);
                  router.replace(
                    successData?.scope === "PERSONAL" ? "/(tabs)/personal" : "/(tabs)/home"
                  );
                }}
                size="medium"
                style={styles.successBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeaderLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  scopeCardsRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  scopeCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  scopeCardFirst: {
    marginRight: spacing.sm,
  },
  scopeCardText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  scopeCardInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    ...shadows.sm,
  },
  scopeCardActive: {
    backgroundColor: colors.recessedBg,
    borderColor: colors.primary,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 1px 4px rgba(35, 122, 87, 0.12)",
        }
      : {}),
  },
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  cardSelectedBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  scopeTitle: {
    ...typography.body1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scopeTitleActive: {
    color: colors.primary,
  },
  scopeSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  amountTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  amountLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: "center",
    paddingVertical: 0,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  amountErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 6,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  fieldLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs + 2,
    textTransform: "uppercase",
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
  },
  leaderNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.recessedBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  leaderNoticeText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  groupScroll: {
    marginBottom: spacing.sm,
  },
  groupPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  groupPillUnselected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorder,
  },
  groupPillSelected: {
    backgroundColor: colors.recessedBg,
    borderColor: colors.primary,
    borderTopColor: colors.recessedTopBorder,
  },
  groupPillName: {
    ...typography.body2,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  groupPillNameSelected: {
    color: colors.primary,
  },
  groupPillMembers: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyHintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginVertical: spacing.xs,
  },
  fieldErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
  },
  participantsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  participantHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  selectAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 11,
  },
  membersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberChipIncluded: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
  },
  memberChipExcluded: {
    backgroundColor: colors.recessedBg,
    borderColor: colors.surfaceBorder,
    opacity: 0.6,
  },
  memberName: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    maxWidth: 90,
  },
  memberNameIncluded: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  splitPreviewPlaque: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.recessedBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  splitPreviewTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  splitPreviewIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  splitPreviewText: {
    flex: 1,
  },
  splitPreviewLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.6,
  },
  splitPreviewAmount: {
    ...typography.amount,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },
  splitPerPerson: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  splitSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  deadlinesSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  deadlinesRow: {
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  deadlinePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deadlinePillSelected: {
    backgroundColor: colors.recessedBg,
    borderColor: colors.primary,
  },
  deadlinePillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  deadlinePillTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  receiptPreviewBox: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: "hidden",
    position: "relative",
  },
  receiptImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  receiptRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  submitSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  successBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  successCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.xl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  successAmount: {
    ...typography.amount,
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    marginVertical: 4,
  },
  successDetailsCard: {
    width: "100%",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    marginVertical: spacing.md,
    gap: 6,
  },
  successDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  successDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  successDetailValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 12,
    maxWidth: 180,
    textAlign: "right",
  },
  successActions: {
    width: "100%",
    gap: spacing.sm,
  },
  successBtn: {
    width: "100%",
  },
});
