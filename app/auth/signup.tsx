import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
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

  const handleSignUp = async () => {
    if (!Validation.isRequired(name) || !Validation.isRequired(email) || !Validation.isRequired(password)) {
      Alert.alert('Error', 'Please enter all fields');
      return;
    }

    if (!Validation.isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!Validation.isValidPassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
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
      
      Alert.alert('Success', 'Account created!');
      // Don't navigate - let AuthContext handle it automatically
    } catch (error: any) {
      Alert.alert('Sign up failed', error.message);
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
      
      <Button title={loading ? "Creating..." : "Sign Up"} onPress={handleSignUp} disabled={loading} />
      
      <Button 
        title="Already have an account? Log In" 
        onPress={() => router.push('/auth/login')}
      />
    </View>
  );
}