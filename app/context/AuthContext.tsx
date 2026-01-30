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
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
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