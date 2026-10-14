import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigator() {
  const { user, loading, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Auth guard: logged-out users only see /login; logged-in users never see it.
  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!user && !onLogin) router.replace('/login');
    else if (user && onLogin) router.replace('/');
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign in', headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{
          title: 'Students',
          headerRight: () => (
            <Pressable onPress={signOut} hitSlop={10} accessibilityRole="button">
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Logout</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="students/new" options={{ title: 'Add Student' }} />
      <Stack.Screen name="students/[id]/index" options={{ title: 'Student Details' }} />
      <Stack.Screen name="students/[id]/edit" options={{ title: 'Edit Student' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
