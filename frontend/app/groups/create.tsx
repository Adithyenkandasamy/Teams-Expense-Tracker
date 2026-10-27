import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { createGroup } from "../../src/api/groups";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Group } from "../../src/types/models";
import { FadeInView } from "../../src/components/animated";
import {
  RecessedInput,
  PrimaryButton,
  SecondaryButton,
  RaisedIconContainer,
} from "../../src/components/skeuomorphic";

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
        subtitle={createdGroup ? "Invite roommates & split expenses" : "New team or household ledger"}
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
        <FadeInView delay={0}>
          {createdGroup ? (
            <View style={styles.successCard}>
              <View style={styles.cardTopBevel} pointerEvents="none" />

              <RaisedIconContainer size={64} variant="raised" style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={36} color={colors.positive} />
              </RaisedIconContainer>

              <Text style={styles.successTitle}>{createdGroup.name}</Text>
              <Text style={styles.successSubtitle}>
                Your shared ledger is ready. Share this invite code with your friends or roommates so they can join and split expenses.
              </Text>

              <View style={styles.codeContainer}>
                <View style={styles.codeInsetTop} pointerEvents="none" />
                <Text style={styles.codeLabel}>GROUP INVITE CODE</Text>
                <Text style={styles.codeText}>{createdGroup.invite_code}</Text>
              </View>

              <View style={styles.actionRow}>
                <PrimaryButton
                  title="Open Group Ledger"
                  onPress={() => router.replace(`/groups/${createdGroup.id}` as any)}
                  size="large"
                  icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
                />
              </View>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.cardTopBevel} pointerEvents="none" />

              <Text style={styles.sectionHeader}>Group Information</Text>
              <Text style={styles.sectionSub}>
                Set up a shared ledger for your apartment, trip, dinner club, or team.
              </Text>

              <RecessedInput
                label="Group Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Goa Trip, Dinner Club"
                leadingIcon="people-outline"
              />

              <RecessedInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Shared rent, bills, and groceries"
                leadingIcon="document-text-outline"
                multiline
                numberOfLines={3}
                style={{ height: 72, textAlignVertical: "top", paddingTop: 8 }}
                containerStyle={{ height: 72 }}
              />

              <View style={styles.buttonWrapper}>
                <PrimaryButton
                  title={mutation.isPending ? "Creating Group..." : "Create Group"}
                  onPress={handleSubmit}
                  loading={mutation.isPending}
                  size="large"
                  icon={<Ionicons name="add-circle-outline" size={18} color={colors.textInverse} />}
                />
              </View>
            </View>
          )}
        </FadeInView>
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
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  sectionHeader: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
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
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: "800",
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
    maxWidth: 300,
  },
  codeContainer: {
    backgroundColor: colors.recessedBg,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    marginBottom: spacing.xl,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 2px 4px rgba(35, 122, 87, 0.12)",
        }
      : {}),
  },
  codeInsetTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: "700",
    fontSize: 10,
    marginBottom: 4,
  },
  codeText: {
    ...typography.amount,
    fontSize: 28,
    color: colors.primary,
    letterSpacing: 4,
    fontWeight: "800",
  },
  actionRow: {
    width: "100%",
  },
});
