import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../firebaseConfig';
import { router } from 'expo-router';

export default function ProtectedHome() {
  const { userProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 15,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});
