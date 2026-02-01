import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../../services/auth/authService';
import { router } from 'expo-router';
import { Theme } from '../../constants/theme';
import { StyleSheet } from 'react-native';

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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Welcome, {userProfile?.name || 'User'}! 👋
        </Text>

        {/* Main Feature: Dining Hall Button */}
        <TouchableOpacity
          style={styles.diningHallButton}
          onPress={() => router.push('./dining-hall')}
        >
          <Text style={styles.diningHallEmoji}>🍽️</Text>
          <Text style={styles.diningHallTitle}>Dining Hall</Text>
          <Text style={styles.diningHallSubtitle}>Going soon? Let friends know!</Text>
        </TouchableOpacity>

        {/* Other Features */}
        <View style={styles.featuresContainer}>
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('./explore')}
          >
            <Text style={styles.featureEmoji}>🗺️</Text>
            <Text style={styles.featureText}>Explore Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('./feed')}
          >
            <Text style={styles.featureEmoji}>📰</Text>
            <Text style={styles.featureText}>View Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('./new-post')}
          >
            <Text style={styles.featureEmoji}>➕</Text>
            <Text style={styles.featureText}>Create Review</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.xl,
  },
  welcome: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Theme.spacing.xxl,
    color: Theme.colors.text,
  },
  diningHallButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xxl,
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    ...Theme.shadow.large,
  },
  diningHallEmoji: {
    fontSize: 64,
    marginBottom: Theme.spacing.md,
  },
  diningHallTitle: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.surface,
    marginBottom: Theme.spacing.xs,
  },
  diningHallSubtitle: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.surface,
    opacity: 0.9,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  featureButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadow.small,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: Theme.spacing.xs,
  },
  featureText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  signOutButton: {
    backgroundColor: Theme.colors.danger,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  signOutText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
});

