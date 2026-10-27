import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "../../src/components/common/Header";
import { EmptyState } from "../../src/components/common/EmptyState";
import { colors, spacing, typography } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { createSavingsTarget, deleteSavingsTarget, getSavingsTargets, updateSavingsTarget } from "../../src/api/savingsTargets";
import { FadeInView } from "../../src/components/animated";
import { LoadingState } from "../../src/components/common/LoadingState";

export default function TargetsScreen() {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading, isError, refetch } = useQuery({ queryKey: ["savingsTargets"], queryFn: getSavingsTargets });
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");

  const createMutation = useMutation({
    mutationFn: createSavingsTarget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savingsTargets"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, saved_amount }: { id: string; saved_amount: number }) => updateSavingsTarget(id, { saved_amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savingsTargets"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSavingsTarget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savingsTargets"] }),
  });

  const save = () => {
    const goalTarget = Number(target);
    const currentSaved = Number(saved) || 0;
    if (!name.trim() || !Number.isFinite(goalTarget) || goalTarget <= 0 || !Number.isFinite(currentSaved) || currentSaved < 0) return;
    void createMutation.mutateAsync({ name: name.trim(), target_amount: goalTarget, saved_amount: currentSaved })
      .then(() => { setName(""); setTarget(""); setSaved("0"); setVisible(false); })
      .catch((error: Error) => Alert.alert("Could not save target", error.message));
  };

  const editSavedAmount = (goal: (typeof goals)[number]) => {
    setEditingId(goal.id);
    setName(goal.name);
    setTarget(String(goal.target_amount));
    setSaved(String(goal.saved_amount));
    setVisible(true);
  };

  const saveChanges = () => {
    const goalTarget = Number(target);
    const currentSaved = Number(saved);
    if (!editingId || !Number.isFinite(currentSaved) || currentSaved < 0 || !Number.isFinite(goalTarget) || goalTarget <= 0) return;
    void updateMutation.mutateAsync({ id: editingId, saved_amount: currentSaved })
      .then(() => { setEditingId(null); setVisible(false); })
      .catch((error: Error) => Alert.alert("Could not update target", error.message));
  };

  const openCreate = () => { setEditingId(null); setName(""); setTarget(""); setSaved("0"); setVisible(true); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Savings targets" subtitle="Plan for the things ahead" rightAction={<TouchableOpacity onPress={openCreate} style={styles.headerAdd}><Ionicons name="add" size={20} color={colors.textInverse} /><Text style={styles.headerAddText}>New</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView delay={0}>
          <View style={styles.introCard}>
            <Text style={styles.eyebrow}>YOUR GOALS</Text>
            <Text style={styles.intro}>Track what you’ve saved toward a planned purchase or milestone.</Text>
          </View>
        </FadeInView>
        {isLoading ? <LoadingState message="Loading your targets..." /> : isError ? <EmptyState icon="cloud-offline-outline" title="Targets unavailable" description="Check your connection and try again." actionTitle="Try again" onAction={() => { void refetch(); }} /> : goals.length === 0 ? <EmptyState icon="flag-outline" title="No targets yet" description="Create a target and keep track of how much you’ve saved." actionTitle="Create a target" onAction={openCreate} /> : goals.map((goal, index) => {
          const targetAmount = Number(goal.target_amount) || 0;
          const savedAmount = Number(goal.saved_amount) || 0;
          const progress = Math.min(100, targetAmount > 0 ? savedAmount / targetAmount * 100 : 0);
          return <FadeInView key={goal.id} delay={index * 45}>
            <View style={styles.goalCard}>
              <View style={styles.goalTop}>
                <View style={styles.goalIcon}><Ionicons name="flag-outline" size={18} color={colors.primary} /></View>
                <View style={styles.goalActions}><TouchableOpacity onPress={() => editSavedAmount(goal)}><Text style={styles.updateSaved}>Update saved</Text></TouchableOpacity><TouchableOpacity onPress={() => deleteMutation.mutate(goal.id)} accessibilityLabel={`Remove ${goal.name}`}><Ionicons name="trash-outline" size={18} color={colors.textMuted} /></TouchableOpacity></View>
              </View>
              <Text style={styles.goalName}>{goal.name}</Text>
              <View style={styles.amountRow}><Text style={styles.saved}>{formatINR(savedAmount)}</Text><Text style={styles.target}>of {formatINR(targetAmount)}</Text></View>
              <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
              <Text style={styles.progress}>{Math.round(progress)}% saved</Text>
            </View>
          </FadeInView>;
        })}
      </ScrollView>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}><View style={styles.modal}>
          <Text style={styles.modalTitle}>{editingId ? "Update saved amount" : "Create savings target"}</Text>
          {!editingId && <TextInput value={name} onChangeText={setName} placeholder="What are you saving for?" placeholderTextColor={colors.textMuted} style={styles.input} />}
          {!editingId && <TextInput value={target} onChangeText={setTarget} placeholder="Target amount (₹)" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />}
          <TextInput value={saved} onChangeText={setSaved} placeholder="Already saved (₹)" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
          <View style={styles.actions}><TouchableOpacity onPress={() => setVisible(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={editingId ? saveChanges : save} style={styles.save}><Text style={styles.saveText}>{editingId ? "Update" : "Save target"}</Text></TouchableOpacity></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerAdd: { backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 }, headerAddText: { color: colors.textInverse, fontSize: 12, fontWeight: "700" },
  introCard: { backgroundColor: colors.primary, borderRadius: 17, padding: spacing.xl, marginBottom: spacing.lg }, eyebrow: { color: colors.textInverse, opacity: 0.65, fontSize: 10, fontWeight: "700", letterSpacing: 1.1 }, intro: { color: colors.textInverse, fontSize: 16, lineHeight: 23, fontWeight: "600", marginTop: spacing.sm },
  goalCard: { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md }, goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, goalIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }, goalName: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md }, amountRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: spacing.sm }, saved: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" }, target: { color: colors.textSecondary, fontSize: 12 }, track: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: 8, overflow: "hidden", marginTop: spacing.md }, fill: { height: "100%", backgroundColor: colors.success, borderRadius: 8 }, progress: { color: colors.textMuted, fontSize: 11, marginTop: 7 },
  goalActions: { flexDirection: "row", alignItems: "center", gap: spacing.md }, updateSaved: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.48)", justifyContent: "center", padding: spacing.xl }, modal: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.xl }, modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg }, input: { borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.textPrimary, marginBottom: spacing.sm }, actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: spacing.lg, marginTop: spacing.md }, cancel: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" }, save: { borderRadius: 9, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 11 }, saveText: { color: colors.textInverse, fontSize: 13, fontWeight: "700" },
});
