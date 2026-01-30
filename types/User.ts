// User profile type definition
export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  profilePic: string;
  friends: string[];
  createdAt: string;
};

// Auth context type
export type AuthContextType = {
  isLoggedIn: boolean;
  user: import('firebase/auth').User | null;
  userProfile: UserProfile | null;
  loading: boolean;
};

