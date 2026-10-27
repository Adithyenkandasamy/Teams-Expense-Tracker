import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { joinGroup } from "../../src/api/groups";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { FadeInView } from "../../src/components/animated";
import { PrimaryButton, RaisedIconContainer } from "../../src/components/skeuomorphic";

export default function JoinGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const mutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["allExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySpending"] });
      Alert.alert("Success!", "You have successfully joined the group.", [
        {
          text: "Open Group",
          onPress: () => router.replace(`/groups/${data.group_id}` as any),
        },
      ]);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Invalid invite code or already a member.";
      if (msg.toLowerCase().includes("already a member")) {
        Alert.alert(
          "Already a Member",
          "You are already a member of this group!",
          [
            { text: "View Groups", onPress: () => router.replace("/(tabs)/more" as any) },
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Join Failed", msg);
      }
    },
  });

  const handleJoin = () => {
    const cleaned = inviteCode.trim().toUpperCase();
    if (!cleaned) {
      Alert.alert("Validation", "Please enter the invite code.");
      return;
    }
    if (cleaned.length < 4) {
      Alert.alert("Validation", "Invite codes are usually 6 to 8 characters.");
      return;
    }
    mutation.mutate({
      invite_code: cleaned,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Join a Group"
        subtitle="Enter shared invite code"
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
        <FadeInView delay={0}>
          <View style={styles.card}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            {/* Header Icon */}
            <RaisedIconContainer size={54} variant="raised" style={styles.iconCircle}>
              <Ionicons name="key" size={26} color={colors.primary} />
            </RaisedIconContainer>

            <Text style={styles.title}>Have an Invite Code?</Text>
            <Text style={styles.subtitle}>
              Enter the 6 to 8 character code shared by your group leader or roommate to start splitting expenses.
            </Text>

            {/* Recessed Code Input Box */}
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>GROUP INVITE CODE</Text>
              <View style={[styles.codeBox, isFocused && styles.codeBoxFocused]}>
                <View style={styles.boxInsetTop} pointerEvents="none" />

                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={isFocused ? colors.primary : colors.textMuted}
                  style={styles.leadingIcon}
                />
                <TextInput
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g. GR4X9B"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  style={styles.codeInput}
                />
                {inviteCode.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setInviteCode("")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
                <View style={styles.boxInsetBottom} pointerEvents="none" />
              </View>

              <View style={styles.codeFooter}>
                <View style={styles.hintRow}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.hintText}>Case-insensitive letters & numbers</Text>
                </View>
                <Text style={styles.counterText}>{inviteCode.length}/8</Text>
              </View>
            </View>

            {/* Submit Action Button */}
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title={mutation.isPending ? "Verifying Code..." : "Join Group"}
                onPress={handleJoin}
                loading={mutation.isPending}
                disabled={inviteCode.trim().length < 4}
                size="large"
                icon={<Ionicons name="arrow-forward" size={18} color={colors.textInverse} />}
              />
            </View>
          </View>

          {/* Quick Steps Explainer */}
          <View style={styles.stepsCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />
            <Text style={styles.stepsTitle}>How to get a code?</Text>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>Ask the person who created the group for their invite code.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>They can find it at the top of the group details page.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>Paste the code here to immediately see shared bills and settle up.</Text>
            </View>
          </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    alignItems: "center",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  iconCircle: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
    maxWidth: 320,
  },
  codeSection: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
    letterSpacing: 1.1,
    fontSize: 10,
    marginBottom: 8,
  },
  codeBox: {
    width: "100%",
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.recessedBg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 2px 4px rgba(32, 41, 35, 0.08)",
        }
      : {}),
  },
  codeBoxFocused: {
    borderColor: colors.primary,
    borderTopColor: colors.primary,
    backgroundColor: colors.surface,
  },
  boxInsetTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  boxInsetBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedBottomHighlight,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  codeInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
    color: colors.textPrimary,
    textAlign: "center",
    textTransform: "uppercase",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  clearBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  codeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  counterText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 11,
  },
  buttonWrapper: {
    width: "100%",
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    marginTop: spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  stepsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontSize: 14,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  stepText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
