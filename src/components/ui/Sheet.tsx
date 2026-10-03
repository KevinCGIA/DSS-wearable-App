import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ui/IconButton';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={[type.heading, styles.title]} accessibilityRole="header">
              {title}
            </Text>
            <IconButton icon="x" accessibilityLabel="Close" onPress={onClose} variant="outlined" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
  },
  panel: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: layout.sheetHandle,
    height: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, flex: 1 },
});
