import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';

/**
 * Authentication service
 * Handles all authentication-related operations
 */
export class AuthService {
  private static formatAuthError(error: unknown, fallback: string) {
    const anyErr = error as any;
    const code = typeof anyErr?.code === 'string' ? anyErr.code : '';
    const message =
      error instanceof Error
        ? error.message
        : typeof anyErr?.message === 'string'
          ? anyErr.message
          : fallback;
    return code ? `${message} (${code})` : message;
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(this.formatAuthError(error, 'Failed to sign in'));
    }
  }

  /**
   * Create a new user account
   */
  static async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      return userCredential.user;
    } catch (error) {
      throw new Error(this.formatAuthError(error, 'Failed to create account'));
    }
  }

  /**
   * Sign out the current user
   */
  static async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to sign out'
      );
    }
  }

  /**
   * Get the current authenticated user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

