import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createPersonalExpense } from "../../src/api/personalExpenses";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Input } from "../../src/components/common/Input";
import { Button } from "../../src/components/common/Button";

const CATEGORIES = ["Food", "Transport", "Housing", "Bills", "Shopping", "Health", "Entertainment", "Other"];

export default function CreatePersonalExpenseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const createMutation = useMutation({
    mutationFn: createPersonalExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["personalExpenses"] });
      router.back();
    },
    onError: () => Alert.alert("Could not save", "Please check your connection and try again."),
  });

  const submit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Check amount", "Enter an amount greater than zero.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Add a description", "Enter what you spent money on.");
      return;
    }
    createMutation.mutate({
      amount: parsedAmount.toFixed(2),
      description: description.trim(),
      category,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Add personal expense" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon={<Text style={styles.rupee}>₹</Text>}
            style={styles.amountInput}
          />
        </View>

        <Input
          label="What did you spend on?"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Lunch, bus fare, groceries"
          maxLength={255}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              onPress={() => setCategory(item)}
            >
              <Ionicons name={category === item ? "checkmark-circle" : "ellipse-outline"} size={15} color={category === item ? colors.textInverse : colors.textMuted} />
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateNote}>
          <Ionicons name="calendar-outline" size={17} color={colors.textSecondary} />
          <Text style={styles.dateText}>Recorded for today</Text>
        </View>
        <Button title="Save expense" onPress={submit} loading={createMutation.isPending} style={styles.submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  amountCard: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: spacing.lg },
  amountLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm },
  rupee: { color: colors.textSecondary, fontSize: 20, fontWeight: "600" },
  amountInput: { fontSize: 28, fontWeight: "700", paddingVertical: spacing.md },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: "600", marginBottom: spacing.sm },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textSecondary, fontSize: 12, fontWeight: "500" },
  categoryTextActive: { color: colors.textInverse },
  dateNote: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surface },
  dateText: { color: colors.textSecondary, fontSize: 13 },
  submit: { marginTop: spacing.xl },
});
