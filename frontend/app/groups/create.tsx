import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { createGroup } from "../../src/api/groups";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Input } from "../../src/components/common/Input";
import { Button } from "../../src/components/common/Button";
import { Group } from "../../src/types/models";

export default function CreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setCreatedGroup(data);
    },
    onError: (err: any) => {
      Alert.alert(
        "Creation Failed",
        err?.response?.data?.message || err?.message || "Could not create group."
      );
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter a group name.");
      return;
    }
    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={createdGroup ? "Group Created!" : "Create Group"}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/groups" as any);
          }
        }}
      />


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {createdGroup ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={54} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>{createdGroup.name}</Text>
            <Text style={styles.successSubtitle}>
              Your group is ready! Share the invite code below with your roommates or teammates so they can join.
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>INVITE CODE</Text>
              <Text style={styles.codeText}>{createdGroup.invite_code}</Text>
            </View>

            <View style={styles.actionRow}>
              <Button
                title="Go to Group"
                onPress={() => router.replace(`/groups/${createdGroup.id}` as any)}
                variant="primary"
              />
            </View>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>Group Information</Text>
            <Text style={styles.sectionSub}>
              Set up a group for your apartment, trip, or team expenses.
            </Text>

            <Input
              label="Group Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Flat 302, Goa Trip, Office Lunch"
            />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Shared household bills and groceries"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonWrapper}>
              <Button
                title="Create Group"
                onPress={handleSubmit}
                loading={mutation.isPending}
                variant="primary"
                icon={<Ionicons name="add-circle-outline" size={18} color={colors.textInverse} />}
              />
            </View>
          </View>
        )}
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
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionSub: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  buttonWrapper: {
    marginTop: spacing.md,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  successSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.xl,
    width: "100%",
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  codeText: {
    ...typography.h1,
    color: colors.primary,
    letterSpacing: 4,
    fontWeight: "700",
  },
  actionRow: {
    width: "100%",
  },
});
