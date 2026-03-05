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
import { DiningHallEvent, ExtendRequest } from '../../types/DiningHall';
import { CountdownTimer } from '../../components/diningHall/CountdownTimer';
import { Theme } from '../../constants/theme';

export default function DiningHallScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<DiningHallEvent[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [extendOpen, setExtendOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = DiningHallService.subscribeToActiveEvents(user.uid, (active) => {
      setEvents(active);
      setLoading(false);
      resolveNames(active);
    });
    return unsub;
  }, [user?.uid]);

  const resolveNames = async (list: DiningHallEvent[]) => {
    const uids = new Set<string>();
    list.forEach((e) => {
      uids.add(e.creatorId);
      e.participants.forEach((p) => uids.add(p));
      (e.extendRequests || []).forEach((r) => uids.add(r.requesterId));
    });
    if (uids.size === 0) return;
    try {
      const profiles = await UserProfileService.getUserProfiles(Array.from(uids));
      const map: Record<string, string> = {};
      profiles.forEach((p) => { map[p.uid] = p.name; });
      setNames((prev) => ({ ...prev, ...map }));
    } catch {}
  };

  const handleCreate = async (min: number) => {
    if (!user?.uid || !userProfile) return;
    setCreating(true);
    try {
      await DiningHallService.createEvent(user.uid, userProfile.name, min);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCreating(false); setShowCustom(false); setCustomMinutes(''); }
  };

  const getName = (uid: string) => {
    if (uid === user?.uid) return 'You';
    return names[uid] || 'Loading...';
  };

  if (authLoading || loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;
  }

  const myEvent = events.find((e) => e.creatorId === user?.uid);
  const otherEvents = events.filter((e) => e.creatorId !== user?.uid);

  const pendingRequests = (event: DiningHallEvent) =>
    (event.extendRequests || [])
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => r.status === 'pending');

  const myPendingRequest = (event: DiningHallEvent) =>
    (event.extendRequests || []).find(
      (r) => r.requesterId === user?.uid && r.status === 'pending'
    );

  const myDeniedRequest = (event: DiningHallEvent) =>
    (event.extendRequests || []).find(
      (r) => r.requesterId === user?.uid && r.status === 'denied'
    );

  // Owner: extend directly + see pending requests from others
  const renderOwnerExtend = (event: DiningHallEvent) => {
    const pending = pendingRequests(event);
    const isOpen = extendOpen === event.id;
    return (
      <View style={s.extendSection}>
        {pending.length > 0 && (
          <View style={s.requestsBox}>
            <Text style={s.requestsTitle}>Extension Requests</Text>
            {pending.map((r) => (
              <View key={r.index} style={s.requestRow}>
                <Text style={s.requestText}>
                  {getName(r.requesterId)} wants +{r.minutes} min
                </Text>
                <View style={s.requestActions}>
                  <TouchableOpacity
                    style={s.approveBtn}
                    onPress={() => DiningHallService.approveExtend(event.id, r.index)}
                  >
                    <Text style={s.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.denyBtn}
                    onPress={() => DiningHallService.denyExtend(event.id, r.index)}
                  >
                    <Text style={s.denyBtnText}>Deny</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        {isOpen ? (
          <View>
            <Text style={s.extendLabel}>Extend your event by:</Text>
            <View style={s.extendOptions}>
              {[5, 10, 15, 30].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={s.extendChip}
                  onPress={async () => {
                    await DiningHallService.extendEvent(event.id, m);
                    setExtendOpen(null);
                  }}
                >
                  <Text style={s.extendChipText}>+{m}m</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.chipCancel} onPress={() => setExtendOpen(null)}>
                <Text style={s.chipCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.extendBtn} onPress={() => setExtendOpen(event.id)}>
            <Text style={s.extendBtnText}>Extend Time</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Participant: request extension (owner must approve)
  const renderParticipantExtend = (event: DiningHallEvent) => {
    const pending = myPendingRequest(event);
    const denied = myDeniedRequest(event);
    const isOpen = extendOpen === event.id;

    if (pending) {
      return (
        <View style={s.extendSection}>
          <View style={s.pendingBanner}>
            <Text style={s.pendingBannerText}>
              Your request for +{pending.minutes} min is waiting for approval
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={s.extendSection}>
        {denied && (
          <View style={s.deniedBanner}>
            <Text style={s.deniedBannerText}>
              Your request for +{denied.minutes} min was denied
            </Text>
          </View>
        )}
        {isOpen ? (
          <View>
            <Text style={s.extendLabel}>Request extra time:</Text>
            <View style={s.extendOptions}>
              {[5, 10, 15, 30].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={s.requestChip}
                  onPress={async () => {
                    await DiningHallService.requestExtend(event.id, user!.uid, m);
                    setExtendOpen(null);
                  }}
                >
                  <Text style={s.requestChipText}>+{m}m</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.chipCancel} onPress={() => setExtendOpen(null)}>
                <Text style={s.chipCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.requestExtendBtn} onPress={() => setExtendOpen(event.id)}>
            <Text style={s.requestExtendBtnText}>Request Extension</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderParticipants = (event: DiningHallEvent) => (
    <View style={s.participantsList}>
      <Text style={s.goingLabel}>Going ({event.participants.length}):</Text>
      {event.participants.map((uid) => (
        <View key={uid} style={s.participantRow}>
          <View style={s.dot} />
          <Text style={s.participantName}>{getName(uid)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <Text style={s.title}>Dining Hall</Text>
      <Text style={s.subtitle}>See who's going and join them</Text>

      {myEvent ? (
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.badge}><Text style={s.badgeText}>YOUR EVENT</Text></View>
          </View>
          <CountdownTimer
            targetTime={myEvent.targetTime}
            onComplete={() => DiningHallService.completeEvent(myEvent.id)}
          />
          {renderParticipants(myEvent)}
          {renderOwnerExtend(myEvent)}
          <TouchableOpacity style={s.cancelBtn}
            onPress={() => DiningHallService.completeEvent(myEvent.id)}
          >
            <Text style={s.cancelBtnText}>Cancel Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.cardTitle}>Going soon?</Text>
          <Text style={s.cardSub}>Let everyone know when you're heading to the dining hall</Text>
          <View style={s.timeButtons}>
            {[15, 30].map((m) => (
              <TouchableOpacity key={m} style={[s.timeBtn, creating && s.disabled]}
                onPress={() => handleCreate(m)} disabled={creating}
              >
                <Text style={s.timeBtnText}>{m} min</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[s.timeBtn, s.timeBtnOutline, creating && s.disabled]}
              onPress={() => setShowCustom(!showCustom)} disabled={creating}
            >
              <Text style={[s.timeBtnText, s.timeBtnOutlineText]}>Custom</Text>
            </TouchableOpacity>
          </View>
          {showCustom && (
            <View style={s.customRow}>
              <TextInput style={s.customInput} placeholder="Minutes"
                keyboardType="numeric" value={customMinutes} onChangeText={setCustomMinutes}
              />
              <TouchableOpacity style={[s.customGo, !customMinutes && s.disabled]}
                onPress={() => { const n = parseInt(customMinutes, 10); if (n > 0) handleCreate(n); }}
                disabled={!customMinutes || creating}
              >
                <Text style={s.customGoText}>Go</Text>
              </TouchableOpacity>
            </View>
          )}
          {creating && <ActivityIndicator style={{ marginTop: 12 }} color={Theme.colors.primary} />}
        </View>
      )}

      {otherEvents.length > 0 && (
        <Text style={s.sectionTitle}>Active Events ({otherEvents.length})</Text>
      )}

      {otherEvents.map((event) => {
        const joined = event.participants.includes(user?.uid || '');
        return (
          <View key={event.id} style={s.card}>
            <View style={s.eventHeader}>
              <Text style={s.creatorName}>{names[event.creatorId] || event.creatorName}</Text>
              <Text style={s.creatorSub}>is heading to the dining hall</Text>
            </View>
            <CountdownTimer targetTime={event.targetTime} />
            {renderParticipants(event)}
            {joined && renderParticipantExtend(event)}
            {joined ? (
              <TouchableOpacity style={s.leaveBtn}
                onPress={() => DiningHallService.leaveEvent(event.id, user!.uid)}
              >
                <Text style={s.leaveBtnText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.joinBtn}
                onPress={() => DiningHallService.joinEvent(event.id, user!.uid)}
              >
                <Text style={s.joinBtnText}>Join — I'm going too!</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {events.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🍽️</Text>
          <Text style={s.emptyText}>No one's going right now</Text>
          <Text style={s.emptySub}>Be the first — create an event above!</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: Theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },

  card: { backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 20, marginBottom: 14, ...Theme.shadow.medium },
  cardHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  badge: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: Theme.colors.primary, fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  cardSub: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 18 },

  timeButtons: { flexDirection: 'row', gap: 10 },
  timeBtn: { flex: 1, backgroundColor: Theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  timeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timeBtnOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Theme.colors.primary },
  timeBtnOutlineText: { color: Theme.colors.primary },
  disabled: { opacity: 0.5 },

  customRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  customInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12, fontSize: 16 },
  customGo: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  customGoText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginTop: 10, marginBottom: 12 },
  eventHeader: { marginBottom: 4 },
  creatorName: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  creatorSub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 2 },

  participantsList: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Theme.colors.borderLight },
  goingLabel: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 8 },
  participantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.success, marginRight: 10 },
  participantName: { fontSize: 15, color: Theme.colors.text },

  joinBtn: { backgroundColor: Theme.colors.success, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.danger, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  leaveBtnText: { color: Theme.colors.danger, fontSize: 15, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.danger, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: Theme.colors.danger, fontSize: 15, fontWeight: '600' },

  // Owner extend (direct)
  extendSection: { marginTop: 12 },
  extendBtn: { backgroundColor: '#fff3e0', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#ff9800' },
  extendBtnText: { color: '#e65100', fontSize: 15, fontWeight: '600' },
  extendLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 8 },
  extendOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  extendChip: { backgroundColor: '#ff9800', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  extendChipText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chipCancel: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  chipCancelText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },

  // Participant request extend
  requestExtendBtn: { backgroundColor: '#e3f2fd', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  requestExtendBtnText: { color: Theme.colors.primary, fontSize: 15, fontWeight: '600' },
  requestChip: { backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  requestChipText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Pending / denied banners
  pendingBanner: { backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ffc107' },
  pendingBannerText: { color: '#f57f17', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  deniedBanner: { backgroundColor: '#fce4ec', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ef9a9a' },
  deniedBannerText: { color: '#c62828', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Owner incoming requests
  requestsBox: { backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ffc107' },
  requestsTitle: { fontSize: 14, fontWeight: '700', color: '#f57f17', marginBottom: 10 },
  requestRow: { marginBottom: 10 },
  requestText: { fontSize: 14, color: Theme.colors.text, fontWeight: '600', marginBottom: 6 },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: Theme.colors.success, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  denyBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.danger, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  denyBtnText: { color: Theme.colors.danger, fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Theme.colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 6 },
});
