import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { ErrorView, LoadingView } from '@/components/StateViews';
import { StudentForm } from '@/components/StudentForm';
import { studentApi } from '@/services/studentApi';
import { Student, StudentInput } from '@/types/student';
import { getErrorMessage } from '@/utils/errors';

export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setStudent(await studentApi.get(id));
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load this student.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (data: StudentInput) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await studentApi.update(id, data);
      // Details and list screens reload when they regain focus.
      Alert.alert('Success', 'Student updated successfully.', [{ text: 'OK', onPress: () => router.back() }], {
        cancelable: false,
      });
    } catch (e) {
      Alert.alert('Could not update student', getErrorMessage(e, 'Failed to update the student.'));
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingView message="Loading student..." />;
  if (error || !student) return <ErrorView message={error ?? 'Student not found.'} onRetry={load} />;

  return <StudentForm initial={student} submitLabel="Save Changes" submitting={submitting} onSubmit={onSubmit} />;
}
