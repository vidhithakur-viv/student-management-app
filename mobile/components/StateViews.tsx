import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button title="Try again" onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.danger, textAlign: 'center' },
  muted: { color: colors.muted, textAlign: 'center', fontSize: 15 },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
