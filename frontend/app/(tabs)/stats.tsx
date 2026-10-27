import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";
import { getMonthlySpending } from "../../src/api/analytics";
import { getMyExpenses } from "../../src/api/expenses";
import { formatINR } from "../../src/utils/formatters";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { FadeInView } from "../../src/components/animated";
import {
  SpendingChart,
  ProgressBar,
  RaisedIconContainer,
  CATEGORY_ICONS,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  TransactionRow,
} from "../../src/components/skeuomorphic";

export default function StatsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["monthlySpending", 6],
    queryFn: () => getMonthlySpending(6),
    enabled: !!user,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["allExpenses"],
    queryFn: getMyExpenses,
    enabled: !!user,
  });

  const months = data?.months || [];
  const current = months[months.length - 1];
  const personalTotal = Number(current?.personal_total) || 0;
  const groupTotal = Number(current?.group_total) || 0;
  const groupShare = Number(current?.your_group_share) || 0;
  const trackedTotal = personalTotal + groupShare;

  // Filter expenses for modal inspection
  const categoryExpenses = selectedCategory
    ? allExpenses.filter((e) => e.category === selectedCategory)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Spending Insights" subtitle="Tracked personal and group finances" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : isError ? (
          <ErrorState
            message="Could not load your monthly spending insights."
            onRetry={refetch}
          />
        ) : (
          <>
            {/* Top Dimensional Ledger Plaque */}
            <FadeInView delay={0}>
              <View style={styles.ledgerPlaque}>
                <View style={styles.plaqueTopHighlight} pointerEvents="none" />

                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Ionicons name="wallet-outline" size={13} color={colors.primary} />
                    <Text style={styles.badgeText}>COMBINED TRACKED SPENDING</Text>
                  </View>
                </View>

                <Text style={styles.totalAmount}>{formatINR(trackedTotal)}</Text>
                <Text style={styles.totalSubtitle}>
                  Personal spending plus your individual group share
                </Text>

                {/* 3 Pillars: Personal, Your Share, Total Group */}
                <View style={styles.metricsPillars}>
                  <View style={styles.metricPillar}>
                    <Text style={styles.metricLabel}>PERSONAL</Text>
                    <Text style={styles.metricValue}>{formatINR(personalTotal)}</Text>
                  </View>

                  <View style={styles.pillarDivider} />

                  <View style={styles.metricPillar}>
                    <Text style={styles.metricLabel}>YOUR SHARE</Text>
                    <Text style={styles.metricValue}>{formatINR(groupShare)}</Text>
                  </View>

                  <View style={styles.pillarDivider} />

                  <View style={styles.metricPillar}>
                    <Text style={styles.metricLabel}>ALL GROUPS</Text>
                    <Text style={styles.metricValue}>{formatINR(groupTotal)}</Text>
                  </View>
                </View>
              </View>
            </FadeInView>

            {/* Six-Month Comparative Dimensional Bar Chart */}
            <FadeInView delay={70}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Six Month Trend</Text>
                {months.length ? (
                  <SpendingChart months={months} />
                ) : (
                  <EmptyState
                    icon="bar-chart-outline"
                    title="No Spending History"
                    description="Your 6-month comparative trend will appear as you record expenses."
                  />
                )}
              </View>
            </FadeInView>

            {/* Category Breakdown */}
            <FadeInView delay={140}>
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Category Breakdown</Text>
                  <Text style={styles.sectionHint}>Tap category for transactions</Text>
                </View>

                {!data?.categories?.length ? (
                  <EmptyState
                    icon="pie-chart-outline"
                    title="No Categories Yet"
                    description="Record personal or group expenses to see category breakdown."
                  />
                ) : (
                  <View style={styles.categoryCardList}>
                    {data.categories.map((category) => {
                      const personal = Number(category.personal_total) || 0;
                      const shared = Number(category.your_group_share) || 0;
                      const catTotal = personal + shared;
                      const ratio = trackedTotal > 0 ? (catTotal / trackedTotal) * 100 : 0;
                      const iconName = CATEGORY_ICONS[category.category] || "pricetag-outline";

                      return (
                        <TouchableOpacity
                          key={category.category}
                          activeOpacity={0.88}
                          onPress={() => setSelectedCategory(category.category)}
                          style={styles.categoryItem}
                        >
                          <View style={styles.categoryTopBevel} pointerEvents="none" />

                          <View style={styles.categoryTopRow}>
                            <View style={styles.categoryNameCol}>
                              <RaisedIconContainer size={34} variant="raised">
                                <Ionicons name={iconName} size={17} color={colors.primary} />
                              </RaisedIconContainer>
                              <Text style={styles.categoryNameText}>{category.category}</Text>
                            </View>

                            <View style={styles.categoryAmountCol}>
                              <Text style={styles.categoryAmountText}>{formatINR(catTotal)}</Text>
                              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                            </View>
                          </View>

                          <View style={styles.progressRow}>
                            <ProgressBar progress={ratio} height={7} />
                          </View>

                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>
                              Personal: <Text style={styles.boldText}>{formatINR(personal)}</Text>
                            </Text>
                            <Text style={styles.breakdownDot}>·</Text>
                            <Text style={styles.breakdownText}>
                              Group share: <Text style={styles.boldText}>{formatINR(shared)}</Text>
                            </Text>
                            <Text style={styles.breakdownDot}>·</Text>
                            <Text style={styles.percentText}>{Math.round(ratio)}%</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </FadeInView>
          </>
        )}
      </ScrollView>

      {/* Category Inspection Modal */}
      <Modal
        visible={!!selectedCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetTopBevel} pointerEvents="none" />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <RaisedIconContainer size={36} variant="raised">
                  <Ionicons
                    name={
                      selectedCategory ? CATEGORY_ICONS[selectedCategory] || "pricetag" : "pricetag"
                    }
                    size={18}
                    color={colors.primary}
                  />
                </RaisedIconContainer>
                <Text style={styles.sheetTitle}>{selectedCategory}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.sheetCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              {categoryExpenses.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  title="No Transactions"
                  description={`No recent transactions found under ${selectedCategory}.`}
                />
              ) : (
                categoryExpenses.map((exp) => (
                  <TransactionRow
                    key={exp.id}
                    expense={exp}
                    currentUserId={user?.id}
                    onPress={() => {
                      setSelectedCategory(null);
                      router.push(`/expenses/${exp.id}` as any);
                    }}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  ledgerPlaque: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 6px 18px rgba(32, 41, 35, 0.08), 0 1px 3px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  plaqueTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.recessedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.8,
  },
  totalAmount: {
    ...typography.amount,
    fontSize: 34,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  totalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  metricsPillars: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  metricPillar: {
    flex: 1,
    alignItems: "center",
  },
  pillarDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  metricValue: {
    ...typography.h3,
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  categoryCardList: {
    gap: spacing.sm,
  },
  categoryItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 1.5,
    padding: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
  },
  categoryTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  categoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryNameCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryNameText: {
    ...typography.body1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  categoryAmountCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryAmountText: {
    ...typography.body1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  progressRow: {
    marginVertical: spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  breakdownDot: {
    color: colors.textMuted,
    fontSize: 10,
  },
  percentText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
  },
  sheetTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetBody: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
