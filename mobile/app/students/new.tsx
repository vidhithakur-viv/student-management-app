import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';

import { StudentForm } from '@/components/StudentForm';
import { studentApi } from '@/services/studentApi';
import { StudentInput } from '@/types/student';
import { getErrorMessage } from '@/utils/errors';

export default function AddStudentScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: StudentInput) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await studentApi.create(data);
      // The list reloads itself when it regains focus.
      Alert.alert('Success', 'Student created successfully.', [{ text: 'OK', onPress: () => router.back() }], {
        cancelable: false,
      });
    } catch (e) {
      Alert.alert('Could not create student', getErrorMessage(e, 'Failed to create the student.'));
      setSubmitting(false);
    }
  };

  return <StudentForm submitLabel="Create Student" submitting={submitting} onSubmit={onSubmit} />;
}
