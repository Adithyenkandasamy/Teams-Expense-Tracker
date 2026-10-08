import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getGroupBalances } from "../../src/api/balances";
import { colors, spacing, typography } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Header } from "../../src/components/common/Header";
import { BalanceCard } from "../../src/components/balance/BalanceCard";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";

export default function GroupBalancesScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const {
    data: balances,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groupBalances", groupId],
    queryFn: () => getGroupBalances(groupId),
    enabled: !!groupId,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Group Balances"
        subtitle={balances?.group_name || "Settlement summary"}
        showBack
        onBack={() => router.back()}
      />

      {isLoading && !balances ? (
        <LoadingState message="Calculating balances from backend..." fullScreen />
      ) : !balances ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Could Not Load Balances"
          description="Failed to fetch balance calculations for this group."
        />
      ) : (
        <FlatList
          data={balances.balances}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryContainer}>
              {/* Total Owe Card */}
              <View style={[styles.summaryCard, styles.oweBorder]}>
                <View style={styles.summaryTop}>
                  <Ionicons name="arrow-up-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.summaryLabel}>Total You Owe</Text>
                </View>
                <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                  {formatINR(balances.total_you_owe)}
                </Text>
              </View>

              {/* Total Owed To You Card */}
              <View style={[styles.summaryCard, styles.owedBorder]}>
                <View style={styles.summaryTop}>
                  <Ionicons name="arrow-down-circle-outline" size={18} color={colors.primary} />
                  <Text style={styles.summaryLabel}>Owed to You</Text>
                </View>
                <Text style={[styles.summaryAmount, { color: colors.primary }]}>
                  {formatINR(balances.total_owed_to_you)}
                </Text>
              </View>

              {/* Net Balance Card */}
              <View style={styles.netCard}>
                <Text style={styles.netLabel}>Your Net Position in Group</Text>
                <Text
                  style={[
                    styles.netAmount,
                    {
                      color:
                        parseFloat(String(balances.net_balance)) >= 0
                          ? colors.primary
                          : colors.danger,
                    },
                  ]}
                >
                  {formatINR(balances.net_balance)}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Roommate Breakdown</Text>
            </View>
          }
          renderItem={({ item }) => <BalanceCard balance={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="All Settled Up!"
              description="No outstanding balances among group members."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  summaryContainer: {
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  oweBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  owedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  summaryAmount: {
    ...typography.amount,
    marginTop: 4,
  },
  netCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  netLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  netAmount: {
    ...typography.h2,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
