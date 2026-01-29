import { Stack } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../firebaseConfig';

export default function ProtectedLayout() {
  const { userProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="explore" 
        options={{ 
          headerTitle: '🗺️ Explore Map',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="feed" 
        options={{ 
          headerTitle: '📰 Feed',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="new-post" 
        options={{ 
          headerTitle: '➕ Create Review',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="place-detail" 
        options={{ 
          headerTitle: 'Place Details',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}
