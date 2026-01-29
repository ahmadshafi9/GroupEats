import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, getAuth, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Define what user profile looks like in Firestore
type UserProfile = {
  name: string;
  email: string;
  profilePic: string;
  friends: string[];
  createdAt: string;
};

// Define what data the context provides
type AuthContextType = {
  isLoggedIn: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
};

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
          // Get reference to user document in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Fetch the document
          const userDoc = await getDoc(userDocRef);
          
          // Check if document exists
          if (userDoc.exists()) {
            // Get the data and store it in state
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            console.log('User profile not found in Firestore');
            setUserProfile(null);
          }
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