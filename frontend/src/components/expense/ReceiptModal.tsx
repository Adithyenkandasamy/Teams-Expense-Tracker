import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme/colors";

interface ReceiptModalProps {
  visible: boolean;
  imageUrl?: string | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleClose = () => {
    setLoading(true);
    setHasError(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Expense Receipt</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content area */}
        <View style={styles.content}>
          {!imageUrl || hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.textMuted}
              />
              <Text style={styles.errorTitle}>Receipt Unavailable</Text>
              <Text style={styles.errorDescription}>
                This receipt image might have been deleted after the automatic
                retention period (2 days after expense closure) or was not provided.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading receipt...</Text>
                </View>
              )}
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth - 32,
    height: screenHeight - 160,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  errorDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
