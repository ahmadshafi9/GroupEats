import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isLoggedIn, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(protected)');
    }
  }, [isLoggedIn, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="(protected)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
