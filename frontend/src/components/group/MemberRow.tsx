import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GroupMember } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";
import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";

interface MemberRowProps {
  member: GroupMember;
  isCurrentUser?: boolean;
  onRemove?: () => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, isCurrentUser, onRemove }) => {
  const userName = member.user?.name || "Member";
  const userEmail = member.user?.email || "";
  const profileImage = member.user?.profile_image;
  const isLeader = member.role === "LEADER" || member.role === "OWNER";

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Avatar name={userName} imageUrl={profileImage} size={44} />
        <View style={styles.infoArea}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {userName}
            </Text>
            {isCurrentUser && <Text style={styles.youBadge}>(You)</Text>}
          </View>
          {userEmail ? (
            <Text style={styles.email} numberOfLines={1}>
              {userEmail}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightActions}>
        <Badge
          label={isLeader ? "Group Leader" : "Member"}
          color={isLeader ? colors.secondary : colors.textMuted}
          bg={isLeader ? colors.secondaryMuted : colors.surfaceBorder}
          size="small"
        />
        {onRemove && <TouchableOpacity style={styles.removeButton} onPress={onRemove} accessibilityLabel={`Remove ${userName} from group`}>
          <Ionicons name="person-remove-outline" size={17} color={colors.danger} />
        </TouchableOpacity>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  rightActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  removeButton: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.dangerBg, alignItems: "center", justifyContent: "center" },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
  infoArea: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    ...typography.body1,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  youBadge: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
