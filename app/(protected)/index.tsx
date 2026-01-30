import { View, Text, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../../services/auth/authService';
import { router } from 'expo-router';
import { commonStyles } from '../../styles/common.styles';

export default function ProtectedHome() {
  const { userProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await AuthService.signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.welcome}>
        Welcome, {userProfile?.name || 'User'}!
      </Text>
      
      <Button 
        title="🗺️ Explore Map" 
        onPress={() => router.push('./explore')}
      />
      
      <Button 
        title="📰 View Feed" 
        onPress={() => router.push('./feed')}
      />
      
      <Button 
        title="➕ Create Review" 
        onPress={() => router.push('./new-post')}
      />
      
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
