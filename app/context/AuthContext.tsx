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
  refreshProfile: async () => {},
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
          
          if (!profile) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || '',
              friends: [],
              createdAt: new Date().toISOString(),
            };
            try {
              await UserProfileService.createUserProfile(firebaseUser.uid, newProfile);
            } catch {
              // write failed (e.g. offline), still use locally
            }
            setUserProfile(newProfile);
          } else {
            setUserProfile(profile);
          }
        } catch (error) {
          const fallback: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            profilePic: firebaseUser.photoURL || '',
            friends: [],
            createdAt: new Date().toISOString(),
          };
          setUserProfile(fallback);
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

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await UserProfileService.getUserProfile(user.uid);
      if (profile) setUserProfile(profile);
    } catch {
      // silently fail on refresh
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn: !!user, 
        user, 
        userProfile,
        loading: initializing,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;