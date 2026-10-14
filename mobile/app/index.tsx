import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing } from '@/constants/theme';
import { studentApi } from '@/services/studentApi';
import { Student } from '@/types/student';
import { getErrorMessage } from '@/utils/errors';

export default function StudentListScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true); // full-screen first load
  const [busy, setBusy] = useState(false); // searching / background reload
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryRef = useRef('');
  const requestId = useRef(0); // ignore out-of-order responses
  const firstSearchRun = useRef(true);
  const hasLoaded = useRef(false);

  const fetchStudents = useCallback(async (q: string, mode: 'initial' | 'quiet' | 'pull' = 'quiet') => {
    const id = ++requestId.current;
    if (mode === 'initial') setLoading(true);
    else if (mode === 'pull') setRefreshing(true);
    else setBusy(true);
    try {
      const trimmed = q.trim();
      const data = trimmed ? await studentApi.search(trimmed) : await studentApi.list();
      if (id !== requestId.current) return;
      setStudents(data);
      setError(null);
      hasLoaded.current = true;
    } catch (e) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(e, 'Could not load students.'));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setBusy(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload whenever the screen gains focus (after add / edit / delete).
  useFocusEffect(
    useCallback(() => {
      fetchStudents(queryRef.current, hasLoaded.current ? 'quiet' : 'initial');
    }, [fetchStudents])
  );

  // Debounced search as the user types.
  useEffect(() => {
    queryRef.current = query;
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    const t = setTimeout(() => fetchStudents(query, 'quiet'), 400);
    return () => clearTimeout(t);
  }, [query, fetchStudents]);

  const searching = query.trim().length > 0;

  const renderBody = () => {
    if (loading) return <LoadingView message="Loading students..." />;
    if (error && students.length === 0) return <ErrorView message={error} onRetry={() => fetchStudents(query, 'initial')} />;
    return (
      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        contentContainerStyle={students.length === 0 ? styles.emptyList : styles.list}
        refreshing={refreshing}
        onRefresh={() => fetchStudents(query, 'pull')}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={error ? <Text style={styles.inlineError}>{error}</Text> : null}
        ListEmptyComponent={
          searching ? (
            <EmptyView title="No students found" message={`No results for "${query.trim()}". Try a different name, email or course.`} />
          ) : (
            <EmptyView title="No students yet" message="Tap “Add Student” to create the first one." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push({ pathname: '/students/[id]', params: { id: item.id } })}
            accessibilityRole="button"
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.meta}>
              {item.course} • Year {item.year}
            </Text>
          </Pressable>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, email or course"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {busy ? <ActivityIndicator style={styles.searchSpinner} color={colors.primary} /> : null}
      </View>
      <View style={styles.body}>{renderBody()}</View>
      <View style={styles.footer}>
        <Button title="Add Student" onPress={() => router.push('/students/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { padding: spacing.lg, paddingBottom: spacing.sm, justifyContent: 'center' },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 16,
    color: colors.text,
  },
  searchSpinner: { position: 'absolute', right: spacing.lg + spacing.md },
  body: { flex: 1 },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardPressed: { opacity: 0.85 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  meta: { fontSize: 14, color: colors.primary, marginTop: spacing.sm, fontWeight: '500' },
  inlineError: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  footer: { padding: spacing.lg, backgroundColor: colors.background },
});
