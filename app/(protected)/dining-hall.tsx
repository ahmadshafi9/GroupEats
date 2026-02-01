import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { DiningHallService } from '../../services/diningHall/diningHallService';
import { NotificationService } from '../../services/diningHall/notificationService';
import { DiningHallEvent } from '../../types/DiningHall';
import { CountdownTimer } from '../../components/diningHall/CountdownTimer';
import { Theme } from '../../constants/theme';
import { StyleSheet } from 'react-native';

export default function DiningHallScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeEvent, setActiveEvent] = useState<DiningHallEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to active events
    const unsubscribe = DiningHallService.subscribeToActiveEvents(
      user.uid,
      (events) => {
        setActiveEvent(events.length > 0 ? events[0] : null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const handleCreateEvent = async (minutes: number) => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    // Get user name from profile or fallback to email/displayName
    const userName = userProfile?.name || 
                     user.displayName || 
                     user.email?.split('@')[0] || 
                     'User';

    setCreating(true);
    try {
      // Create the event
      const eventId = await DiningHallService.createEvent(
        user.uid,
        userName,
        minutes
      );

      // Notify all friends
      const targetTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      await NotificationService.notifyFriends(
        user.uid,
        userName,
        eventId,
        targetTime,
        minutes
      );

      Alert.alert('Success', `Event created! Your friends have been notified.`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.uid) return;

    try {
      await DiningHallService.joinEvent(eventId, user.uid);
      Alert.alert('Success', "You've joined the event!");
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join event');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  // If no user, redirect (shouldn't happen since this is protected route)
  if (!user?.uid) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please log in to use this feature</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ Dining Hall</Text>
        <Text style={styles.subtitle}>Going soon? Let your friends know!</Text>

        {activeEvent ? (
          <View style={styles.eventContainer}>
            <Text style={styles.eventTitle}>Active Event</Text>
            <Text style={styles.eventCreator}>
              {activeEvent.creatorName} is going in:
            </Text>
            
            <CountdownTimer 
              targetTime={activeEvent.targetTime}
              onComplete={() => {
                setActiveEvent(null);
                Alert.alert('Time\'s up!', 'Time to go to the dining hall! 🍽️');
              }}
            />

            <View style={styles.participantsContainer}>
              <Text style={styles.participantsTitle}>
                Going ({activeEvent.participants.length}):
              </Text>
              {activeEvent.participants.map((participantId, index) => (
                <Text key={index} style={styles.participant}>
                  {participantId === activeEvent.creatorId 
                    ? `${activeEvent.creatorName} (You)` 
                    : 'Friend'}
                </Text>
              ))}
            </View>

            {!activeEvent.participants.includes(user?.uid || '') && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinEvent(activeEvent.id)}
              >
                <Text style={styles.joinButtonText}>Join Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.createContainer}>
            <Text style={styles.createTitle}>Create New Event</Text>
            <Text style={styles.createSubtitle}>
              Choose when you're going. Your friends will be notified!
            </Text>

            <TouchableOpacity
              style={[styles.timeButton, creating && styles.timeButtonDisabled]}
              onPress={() => handleCreateEvent(15)}
              disabled={creating}
            >
              <Text style={styles.timeButtonText}>In 15 Minutes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeButton, creating && styles.timeButtonDisabled]}
              onPress={() => handleCreateEvent(30)}
              disabled={creating}
            >
              <Text style={styles.timeButtonText}>In 30 Minutes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeButton, creating && styles.timeButtonDisabled]}
              onPress={() => {
                Alert.prompt(
                  'Custom Time',
                  'Enter minutes (e.g., 45)',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Create',
                      onPress: (minutes) => {
                        const num = parseInt(minutes || '0', 10);
                        if (num > 0) {
                          handleCreateEvent(num);
                        }
                      },
                    },
                  ],
                  'plain-text',
                  '',
                  'numeric'
                );
              }}
              disabled={creating}
            >
              <Text style={styles.timeButtonText}>Custom Time</Text>
            </TouchableOpacity>

            {creating && (
              <ActivityIndicator 
                size="small" 
                color={Theme.colors.primary} 
                style={styles.loading}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  eventContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    ...Theme.shadow.medium,
  },
  eventTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.md,
  },
  eventCreator: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  participantsContainer: {
    marginTop: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  participantsTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.sm,
  },
  participant: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  joinButton: {
    backgroundColor: Theme.colors.success,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  joinButtonText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  createContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    ...Theme.shadow.medium,
  },
  createTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
  },
  createSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  timeButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  timeButtonDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
  timeButtonText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  loading: {
    marginTop: Theme.spacing.md,
  },
  errorText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.danger,
    textAlign: 'center',
  },
});
