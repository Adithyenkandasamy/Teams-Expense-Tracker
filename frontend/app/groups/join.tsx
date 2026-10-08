import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { joinGroup } from "../../src/api/groups";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Input } from "../../src/components/common/Input";
import { Button } from "../../src/components/common/Button";

export default function JoinGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");

  const mutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      Alert.alert("Success!", "You have successfully joined the group.", [
        {
          text: "Open Group",
          onPress: () => router.replace(`/groups/${data.group_id}` as any),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Join Failed",
        err?.response?.data?.message || err?.message || "Invalid invite code or already a member."
      );
    },
  });

  const handleJoin = () => {
    if (!inviteCode.trim()) {
      Alert.alert("Validation", "Please enter the invite code.");
      return;
    }
    mutation.mutate({
      invite_code: inviteCode.trim().toUpperCase(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Join a Group" showBack onBack={() => router.back()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={40} color={colors.primary} />
          </View>

          <Text style={styles.title}>Have an Invite Code?</Text>
          <Text style={styles.subtitle}>
            Enter the 6-8 character invite code shared by your group leader or roommate.
          </Text>

          <Input
            label="Invite Code *"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            placeholder="e.g. GR4X9B"
            autoCapitalize="characters"
          />

          <View style={styles.buttonWrapper}>
            <Button
              title="Join Group"
              onPress={handleJoin}
              loading={mutation.isPending}
              variant="primary"
              icon={<Ionicons name="enter-outline" size={18} color={colors.textInverse} />}
            />
          </View>
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
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
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
    maxWidth: 280,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: spacing.md,
  },
});
