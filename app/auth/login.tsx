import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { router } from 'expo-router';
import { AuthService } from '../../services/auth/authService';
import { Validation } from '../../utils/validation';
import { authStyles } from '../../styles/auth.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!Validation.isRequired(email) || !Validation.isRequired(password)) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!Validation.isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      // NO manual navigation needed - Stack.Protected handles it!
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : String(error));
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
      <Button title="Sign In" onPress={handleLogin} disabled={loading} />
      <Button 
        title="Don't have an account? Sign Up" 
        onPress={() => router.push('/auth/signup')}
      />
    </View>
  );
}
