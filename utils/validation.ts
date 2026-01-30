/**
 * Validation utilities
 */

export const Validation = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  isValidPassword(password: string): boolean {
    // At least 6 characters
    return password.length >= 6;
  },

  /**
   * Validate rating (1-5)
   */
  isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 5;
  },

  /**
   * Validate required field
   */
  isRequired(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  },
};

