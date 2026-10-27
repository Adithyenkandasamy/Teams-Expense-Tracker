import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../src/store/authStore";
import { getMonthlySpending } from "../../src/api/analytics";
import { formatINR } from "../../src/utils/formatters";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { LoadingState } from "../../src/components/common/LoadingState";
import { MonthlyBarChart } from "../../src/components/analytics/MonthlyBarChart";
import { FadeInView } from "../../src/components/animated";

export default function StatsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["monthlySpending", 6],
    queryFn: () => getMonthlySpending(6),
    enabled: !!user,
  });

  const months = data?.months || [];
  const current = months[months.length - 1];
  const personalTotal = Number(current?.personal_total) || 0;
  const groupTotal = Number(current?.group_total) || 0;
  const groupShare = Number(current?.your_group_share) || 0;
  const trackedTotal = personalTotal + groupShare;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Spending insights" subtitle="Your money, across every space" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isLoading ? <LoadingState message="Loading your stats..." /> : (
          <>
            <FadeInView delay={0}>
              <View style={styles.monthCard}>
                <Text style={styles.overline}>THIS MONTH</Text>
                <Text style={styles.total}>{formatINR(trackedTotal)}</Text>
                <Text style={styles.caption}>Personal spending plus your share of group expenses</Text>
                <View style={styles.metricRow}>
                  <Metric label="PERSONAL" amount={personalTotal} />
                  <View style={styles.divider} />
                  <Metric label="YOUR GROUP SHARE" amount={groupShare} />
                </View>
                <Text style={styles.groupTotal}>Groups spent {formatINR(groupTotal)} altogether</Text>
              </View>
            </FadeInView>

            <FadeInView delay={70}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Six month trend</Text>
                {months.length ? <MonthlyBarChart months={months} /> : <Text style={styles.empty}>No spending recorded yet.</Text>}
              </View>
            </FadeInView>

            <FadeInView delay={140}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category breakdown</Text>
                {!data?.categories.length ? (
                  <Text style={styles.empty}>Add expenses to see what categories take the largest share.</Text>
                ) : (
                  <View style={styles.categoryCard}>
                    {data.categories.map((category) => {
                      const personal = Number(category.personal_total) || 0;
                      const shared = Number(category.your_group_share) || 0;
                      const total = personal + shared;
                      const ratio = trackedTotal > 0 ? (total / trackedTotal) * 100 : 0;
                      return (
                        <View key={category.category} style={styles.categoryRow}>
                          <View style={styles.categoryHeader}>
                            <Text style={styles.categoryName}>{category.category}</Text>
                            <Text style={styles.categoryAmount}>{formatINR(total)}</Text>
                          </View>
                          <View style={styles.track}>
                            <View style={[styles.fill, { width: `${Math.max(ratio ? 3 : 0, ratio)}%` }]} />
                          </View>
                          <Text style={styles.categoryDetail}>
                            Personal {formatINR(personal)}  ·  Group share {formatINR(shared)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </FadeInView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricAmount}>{formatINR(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  monthCard: { backgroundColor: colors.primary, borderRadius: 20, padding: spacing.xl },
  overline: { color: colors.textInverse, opacity: 0.72, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  total: { color: colors.textInverse, fontSize: 32, fontWeight: "800", marginTop: 8 },
  caption: { color: colors.textInverse, opacity: 0.76, fontSize: 12, lineHeight: 18, marginTop: 5 },
  metricRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, gap: spacing.lg },
  metric: { flex: 1 },
  metricLabel: { color: colors.textInverse, opacity: 0.68, fontSize: 9, fontWeight: "700", letterSpacing: 0.7 },
  metricAmount: { color: colors.textInverse, fontSize: 16, fontWeight: "700", marginTop: 5 },
  divider: { height: 30, width: 1, backgroundColor: colors.textInverse, opacity: 0.2 },
  groupTotal: { color: colors.textInverse, opacity: 0.68, fontSize: 11, marginTop: spacing.md },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  categoryCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: 16, padding: spacing.lg },
  categoryRow: { marginBottom: spacing.lg },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  categoryName: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  categoryAmount: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  track: { height: 6, borderRadius: 6, overflow: "hidden", backgroundColor: colors.surfaceElevated },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: 6 },
  categoryDetail: { color: colors.textMuted, fontSize: 10, marginTop: 6 },
  empty: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
