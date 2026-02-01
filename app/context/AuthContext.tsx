import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { UserProfile, AuthContextType } from '../../types/User';
import { UserProfileService } from '../../services/auth/userProfileService';

// Create the context box with default values
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // If user is logged in, fetch their profile from Firestore
      if (firebaseUser) {
        try {
          const profile = await UserProfileService.getUserProfile(firebaseUser.uid);
          
          // If profile doesn't exist, create a basic one from auth data
          if (!profile) {
            console.log('User profile not found, creating from auth data');
            setUserProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || '',
              friends: [],
              createdAt: new Date().toISOString(),
            });
          } else {
            setUserProfile(profile);
          }
        } catch (error) {
          // If offline or network error, use auth data as fallback silently
          // This allows the app to work even if Firestore is temporarily unavailable
          if (error instanceof Error && (error.message.includes('offline') || error.message.includes('network'))) {
            // Silently use auth data as fallback - this is expected behavior when offline
            setUserProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || '',
              friends: [],
              createdAt: new Date().toISOString(),
            });
          } else {
            // For other errors, log and use auth data as fallback
            console.warn('Error fetching user profile, using auth data:', error instanceof Error ? error.message : 'Unknown error');
            setUserProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || '',
              friends: [],
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // User logged out, clear profile
        setUserProfile(null);
      }
      
      // Done initializing
      setInitializing(false);
    });
    
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn: !!user, 
        user, 
        userProfile,
        loading: initializing 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;