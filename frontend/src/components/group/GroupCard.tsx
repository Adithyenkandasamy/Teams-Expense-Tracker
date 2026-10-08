import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Group } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const memberCount = group.members?.length || group.member_count || 1;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="people" size={24} color={colors.primary} />
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          {group.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {group.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.codeText}>Code: {group.invite_code}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  infoArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  groupName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 10,
    marginHorizontal: 2,
  },
  codeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
