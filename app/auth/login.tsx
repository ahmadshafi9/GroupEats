import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import { Validation } from '../../utils/validation';
import { authStyles } from '../../styles/auth.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!Validation.isRequired(email) || !Validation.isRequired(password)) {
      showError('Error', 'Please enter email and password');
      return;
    }

    if (!Validation.isValidEmail(email)) {
      showError('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      showError('Login Failed', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Sign In</Text>
      <TextInput
        style={authStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={authStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={authStyles.buttonRow}>
        <TouchableOpacity
          style={[authStyles.primaryButton, loading && authStyles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={authStyles.primaryButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.8}
        >
          <Text style={authStyles.secondaryButtonText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
      <Text style={authStyles.debugText}>
        Firebase: {process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'missing'} · {process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'missing'}
      </Text>
    </View>
  );
}
