import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import { UserProfileService } from '../../services/auth/userProfileService';
import { Validation } from '../../utils/validation';
import { authStyles } from '../../styles/auth.styles';

export default function SignupScreen() {
  const [name, setName] = useState('');
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

  const handleSignUp = async () => {
    if (!Validation.isRequired(name) || !Validation.isRequired(email) || !Validation.isRequired(password)) {
      showError('Error', 'Please enter all fields');
      return;
    }

    if (!Validation.isValidEmail(email)) {
      showError('Error', 'Please enter a valid email address');
      return;
    }

    if (!Validation.isValidPassword(password)) {
      showError('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.signUp(email, password);
      
      await UserProfileService.createUserProfile(user.uid, {
        name: name.trim(),
        email: email.trim(),
        profilePic: '',
        friends: [],
        createdAt: new Date().toISOString(),
      });
      
      showError('Success', 'Account created!');
    } catch (error: any) {
      showError('Sign up failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Create Account</Text>
      
      <TextInput
        style={authStyles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      
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
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={authStyles.primaryButtonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={authStyles.secondaryButton}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.8}
        >
          <Text style={authStyles.secondaryButtonText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
      <Text style={authStyles.debugText}>
        Firebase: {process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'missing'} · {process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'missing'}
      </Text>
    </View>
  );
}