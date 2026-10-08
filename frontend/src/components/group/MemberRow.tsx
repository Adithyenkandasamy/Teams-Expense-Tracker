import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GroupMember } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";
import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";

interface MemberRowProps {
  member: GroupMember;
  isCurrentUser?: boolean;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, isCurrentUser }) => {
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

      <Badge
        label={isLeader ? "Group Leader" : "Member"}
        color={isLeader ? colors.secondary : colors.textMuted}
        bg={isLeader ? colors.secondaryMuted : colors.surfaceBorder}
        size="small"
      />
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
