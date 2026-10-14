import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { colors, spacing } from '@/constants/theme';
import { Student, StudentInput } from '@/types/student';
import { StudentFormErrors, StudentFormValues, validateStudent } from '@/utils/validation';

interface Props {
  initial?: Student;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (data: StudentInput) => void;
}

export function StudentForm({ initial, submitLabel, submitting, onSubmit }: Props) {
  const [values, setValues] = useState<StudentFormValues>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    age: initial ? String(initial.age) : '',
    course: initial?.course ?? '',
    year: initial ? String(initial.year) : '',
  });
  const [errors, setErrors] = useState<StudentFormErrors>({});

  const set = (key: keyof StudentFormValues) => (text: string) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = () => {
    if (submitting) return;
    const result = validateStudent(values);
    setErrors(result.errors);
    if (result.data) onSubmit(result.data);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField label="Name" value={values.name} onChangeText={set('name')} error={errors.name}
          placeholder="Full name" autoCapitalize="words" editable={!submitting} />
        <FormField label="Email" value={values.email} onChangeText={set('email')} error={errors.email}
          placeholder="student@example.com" autoCapitalize="none" autoCorrect={false}
          keyboardType="email-address" editable={!submitting} />
        <FormField label="Phone" value={values.phone} onChangeText={set('phone')} error={errors.phone}
          placeholder="+91 98765 43210" keyboardType="phone-pad" editable={!submitting} />
        <FormField label="Age" value={values.age} onChangeText={set('age')} error={errors.age}
          placeholder="20" keyboardType="number-pad" maxLength={3} editable={!submitting} />
        <FormField label="Course" value={values.course} onChangeText={set('course')} error={errors.course}
          placeholder="Computer Science" autoCapitalize="words" editable={!submitting} />
        <FormField label="Year" value={values.year} onChangeText={set('year')} error={errors.year}
          placeholder="1" keyboardType="number-pad" maxLength={2} editable={!submitting} />
        <Button title={submitLabel} onPress={submit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
});
