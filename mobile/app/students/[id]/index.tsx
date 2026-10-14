import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { studentApi } from '@/services/studentApi';
import { Student } from '@/types/student';
import { getErrorMessage } from '@/utils/errors';

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStudent(await studentApi.get(id));
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load this student.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload on focus so edits made on the next screen show up when coming back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = () => {
    Alert.alert('Delete student', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await studentApi.remove(id);
      router.replace('/');
    } catch (e) {
      setDeleting(false);
      Alert.alert('Could not delete student', getErrorMessage(e, 'Failed to delete the student.'));
    }
  };

  if (loading) return <LoadingView message="Loading student..." />;
  if (error || !student) return <ErrorView message={error ?? 'Student not found.'} onRetry={load} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{student.name}</Text>
        <Row label="Email" value={student.email} />
        <Row label="Phone" value={student.phone} />
        <Row label="Age" value={student.age} />
        <Row label="Course" value={student.course} />
        <Row label="Year" value={student.year} />
      </View>

      <View style={styles.actions}>
        <Button
          title="Edit"
          onPress={() => router.push({ pathname: '/students/[id]/edit', params: { id: student.id } })}
          disabled={deleting}
        />
        {user?.role === 'admin' ? (
          <Button title="Delete" variant="danger" onPress={confirmDelete} loading={deleting} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.lg, elevation: 2 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  row: { paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  label: { fontSize: 13, color: colors.muted, marginBottom: 2 },
  value: { fontSize: 16, color: colors.text },
  actions: { marginTop: spacing.xl, gap: spacing.md },
});
