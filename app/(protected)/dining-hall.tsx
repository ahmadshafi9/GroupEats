import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DiningHallService } from '../../services/diningHall/diningHallService';
import { UserProfileService } from '../../services/auth/userProfileService';
import { DiningHallEvent } from '../../types/DiningHall';
import { UserProfile } from '../../types/User';
import { CountdownTimer } from '../../components/diningHall/CountdownTimer';
import { Theme } from '../../constants/theme';

export default function DiningHallScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<DiningHallEvent[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = DiningHallService.subscribeToActiveEvents(
      user.uid,
      (activeEvents) => {
        setEvents(activeEvents);
        setLoading(false);
        resolveNames(activeEvents);
      }
    );
    return unsubscribe;
  }, [user?.uid]);

  const resolveNames = async (eventsList: DiningHallEvent[]) => {
    const allUids = new Set<string>();
    eventsList.forEach((e) => {
      allUids.add(e.creatorId);
      e.participants.forEach((p) => allUids.add(p));
    });
    const uids = Array.from(allUids);
    if (uids.length === 0) return;
    try {
      const profiles = await UserProfileService.getUserProfiles(uids);
      const map: Record<string, string> = {};
      profiles.forEach((p) => { map[p.uid] = p.name; });
      setParticipantNames((prev) => ({ ...prev, ...map }));
    } catch {
      // silently fail
    }
  };

  const handleCreateEvent = async (minutes: number) => {
    if (!user?.uid || !userProfile) return;
    setCreating(true);
    try {
      await DiningHallService.createEvent(user.uid, userProfile.name, minutes);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
      setShowCustom(false);
      setCustomMinutes('');
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.uid) return;
    try {
      await DiningHallService.joinEvent(eventId, user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLeaveEvent = async (event: DiningHallEvent) => {
    if (!user?.uid) return;
    try {
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../../firebaseConfig');
      const eventRef = doc(db, 'diningHallEvents', event.id);
      await updateDoc(eventRef, {
        participants: event.participants.filter((p: string) => p !== user.uid),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getName = (uid: string) => {
    if (uid === user?.uid) return 'You';
    return participantNames[uid] || 'Loading...';
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const myEvent = events.find((e) => e.creatorId === user?.uid);
  const otherEvents = events.filter((e) => e.creatorId !== user?.uid);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <Text style={styles.title}>Dining Hall</Text>
      <Text style={styles.subtitle}>See who's going and join them</Text>

      {/* Create / Your Event Section */}
      {myEvent ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>YOUR EVENT</Text>
            </View>
          </View>
          <CountdownTimer
            targetTime={myEvent.targetTime}
            onComplete={() => DiningHallService.completeEvent(myEvent.id)}
          />
          <View style={styles.participantsList}>
            <Text style={styles.goingLabel}>
              Going ({myEvent.participants.length}):
            </Text>
            {myEvent.participants.map((uid) => (
              <View key={uid} style={styles.participantRow}>
                <View style={styles.dot} />
                <Text style={styles.participantName}>{getName(uid)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Going soon?</Text>
          <Text style={styles.cardSubtitle}>
            Let everyone know when you're heading to the dining hall
          </Text>
          <View style={styles.timeButtons}>
            <TouchableOpacity
              style={[styles.timeBtn, creating && styles.timeBtnDisabled]}
              onPress={() => handleCreateEvent(15)}
              disabled={creating}
            >
              <Text style={styles.timeBtnText}>15 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeBtn, creating && styles.timeBtnDisabled]}
              onPress={() => handleCreateEvent(30)}
              disabled={creating}
            >
              <Text style={styles.timeBtnText}>30 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeBtn, styles.timeBtnOutline, creating && styles.timeBtnDisabled]}
              onPress={() => setShowCustom(!showCustom)}
              disabled={creating}
            >
              <Text style={[styles.timeBtnText, styles.timeBtnOutlineText]}>Custom</Text>
            </TouchableOpacity>
          </View>
          {showCustom && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Minutes"
                keyboardType="numeric"
                value={customMinutes}
                onChangeText={setCustomMinutes}
              />
              <TouchableOpacity
                style={[styles.customGo, !customMinutes && styles.timeBtnDisabled]}
                onPress={() => {
                  const n = parseInt(customMinutes, 10);
                  if (n > 0) handleCreateEvent(n);
                }}
                disabled={!customMinutes || creating}
              >
                <Text style={styles.customGoText}>Go</Text>
              </TouchableOpacity>
            </View>
          )}
          {creating && <ActivityIndicator style={{ marginTop: 12 }} color={Theme.colors.primary} />}
        </View>
      )}

      {/* Other Active Events */}
      {otherEvents.length > 0 && (
        <Text style={styles.sectionTitle}>
          Active Events ({otherEvents.length})
        </Text>
      )}

      {otherEvents.map((event) => {
        const isJoined = event.participants.includes(user?.uid || '');
        return (
          <View key={event.id} style={styles.card}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventCreatorName}>
                {participantNames[event.creatorId] || event.creatorName}
              </Text>
              <Text style={styles.eventCreatorSub}>is heading to the dining hall</Text>
            </View>
            <CountdownTimer targetTime={event.targetTime} />
            <View style={styles.participantsList}>
              <Text style={styles.goingLabel}>
                Going ({event.participants.length}):
              </Text>
              {event.participants.map((uid) => (
                <View key={uid} style={styles.participantRow}>
                  <View style={styles.dot} />
                  <Text style={styles.participantName}>{getName(uid)}</Text>
                </View>
              ))}
            </View>
            {isJoined ? (
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => handleLeaveEvent(event)}
              >
                <Text style={styles.leaveBtnText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => handleJoinEvent(event.id)}
              >
                <Text style={styles.joinBtnText}>Join — I'm going too!</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {events.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No one's going right now</Text>
          <Text style={styles.emptySubtext}>Be the first — create an event above!</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28, fontWeight: '700', textAlign: 'center',
    color: Theme.colors.text, marginBottom: 4,
  },
  subtitle: {
    fontSize: 15, color: Theme.colors.textSecondary,
    textAlign: 'center', marginBottom: 24,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16, padding: 20, marginBottom: 14,
    ...Theme.shadow.medium,
  },
  cardHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  badge: {
    backgroundColor: '#e3f2fd', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { color: Theme.colors.primary, fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 18 },
  timeButtons: { flexDirection: 'row', gap: 10 },
  timeBtn: {
    flex: 1, backgroundColor: Theme.colors.primary,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  timeBtnDisabled: { opacity: 0.5 },
  timeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timeBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: Theme.colors.primary,
  },
  timeBtnOutlineText: { color: Theme.colors.primary },
  customRow: {
    flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center',
  },
  customInput: {
    flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10,
    padding: 12, fontSize: 16,
  },
  customGo: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  customGoText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: Theme.colors.text,
    marginTop: 10, marginBottom: 12,
  },
  eventHeader: { marginBottom: 4 },
  eventCreatorName: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  eventCreatorSub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 2 },
  participantsList: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Theme.colors.borderLight,
  },
  goingLabel: {
    fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 8,
  },
  participantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Theme.colors.success, marginRight: 10,
  },
  participantName: { fontSize: 15, color: Theme.colors.text },
  joinBtn: {
    backgroundColor: Theme.colors.success, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginTop: 14,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.danger,
    paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14,
  },
  leaveBtnText: { color: Theme.colors.danger, fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Theme.colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 6 },
});
