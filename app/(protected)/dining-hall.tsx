import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, TextInput, StyleSheet, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DiningHallService } from '../../services/diningHall/diningHallService';
import { UserProfileService } from '../../services/auth/userProfileService';
import { DiningHallEvent, TimeChangeRequest } from '../../types/DiningHall';
import { CountdownTimer } from '../../components/diningHall/CountdownTimer';
import { Theme } from '../../constants/theme';

type ActionPanel = { eventId: string; mode: 'extend' | 'prepone' } | null;

export default function DiningHallScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<DiningHallEvent[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);
  const [customReqMin, setCustomReqMin] = useState('');

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
    try { await DiningHallService.createEvent(user.uid, userProfile.name, min); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCreating(false); setShowCustom(false); setCustomMinutes(''); }
  };

  const getName = (uid: string) => uid === user?.uid ? 'You' : (names[uid] || 'Loading...');

  const openPanel = (eventId: string, mode: 'extend' | 'prepone') => {
    setActionPanel({ eventId, mode });
    setCustomReqMin('');
  };
  const closePanel = () => { setActionPanel(null); setCustomReqMin(''); };

  if (authLoading || loading) {
    return <View style={st.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;
  }

  const myEvent = events.find((e) => e.creatorId === user?.uid);
  const otherEvents = events.filter((e) => e.creatorId !== user?.uid);

  const pendingReqs = (ev: DiningHallEvent) =>
    (ev.extendRequests || []).map((r, i) => ({ ...r, index: i })).filter((r) => r.status === 'pending');

  const myPending = (ev: DiningHallEvent) =>
    (ev.extendRequests || []).find((r) => r.requesterId === user?.uid && r.status === 'pending');

  const myDenied = (ev: DiningHallEvent) =>
    (ev.extendRequests || []).filter((r) => r.requesterId === user?.uid && r.status === 'denied');

  const renderTimeChips = (
    onSelect: (m: number) => void,
    color: string,
    textColor: string,
  ) => {
    const panelMode = actionPanel?.mode;
    return (
      <View>
        <View style={st.chipRow}>
          {[5, 10, 15].map((m) => (
            <TouchableOpacity key={m} style={[st.chip, { backgroundColor: color }]}
              onPress={() => onSelect(m)}
            >
              <Text style={[st.chipText, { color: textColor }]}>
                {panelMode === 'prepone' ? `-${m}m` : `+${m}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={st.customReqRow}>
          <TextInput
            style={st.customReqInput}
            placeholder="Custom min"
            keyboardType="numeric"
            value={customReqMin}
            onChangeText={setCustomReqMin}
          />
          <TouchableOpacity
            style={[st.customReqGo, { backgroundColor: color }, !customReqMin && st.disabled]}
            onPress={() => {
              const n = parseInt(customReqMin, 10);
              if (n > 0) onSelect(n);
            }}
            disabled={!customReqMin}
          >
            <Text style={[st.customReqGoText, { color: textColor }]}>
              {panelMode === 'prepone' ? 'Prepone' : 'Extend'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.chipCancelBtn} onPress={closePanel}>
            <Text style={st.chipCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Owner card: direct adjust + incoming requests ──
  const renderOwnerControls = (ev: DiningHallEvent) => {
    const pending = pendingReqs(ev);
    const panel = actionPanel?.eventId === ev.id ? actionPanel : null;

    return (
      <View style={st.controlsSection}>
        {pending.length > 0 && (
          <View style={st.requestsBox}>
            <Text style={st.requestsTitle}>Incoming Requests</Text>
            {pending.map((r) => (
              <View key={r.index} style={st.reqRow}>
                <Text style={st.reqText}>
                  {getName(r.requesterId)} {r.type === 'prepone' ? '🍕 wants to go sooner' : 'wants more time'}: {r.type === 'prepone' ? `-${r.minutes}` : `+${r.minutes}`} min
                </Text>
                <View style={st.reqActions}>
                  <TouchableOpacity style={st.approveBtn}
                    onPress={() => DiningHallService.approveTimeChange(ev.id, r.index)}
                  ><Text style={st.approveBtnText}>Approve</Text></TouchableOpacity>
                  <TouchableOpacity style={st.denyBtn}
                    onPress={() => DiningHallService.denyTimeChange(ev.id, r.index)}
                  ><Text style={st.denyBtnText}>Deny</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {panel ? (
          <View>
            <Text style={st.panelLabel}>
              {panel.mode === 'prepone' ? 'Prepone your event by:' : 'Extend your event by:'}
            </Text>
            {renderTimeChips(
              async (m) => {
                await DiningHallService.adjustEventTime(ev.id, m, panel.mode);
                closePanel();
              },
              panel.mode === 'prepone' ? '#e91e63' : '#ff9800',
              '#fff',
            )}
          </View>
        ) : (
          <View style={st.btnRow}>
            <TouchableOpacity style={st.extendBtn} onPress={() => openPanel(ev.id, 'extend')}>
              <Text style={st.extendBtnText}>Extend</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.preponeBtn} onPress={() => openPanel(ev.id, 'prepone')}>
              <Text style={st.preponeBtnText}>Prepone</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Participant card: request extend / prepone ──
  const renderParticipantControls = (ev: DiningHallEvent) => {
    const pending = myPending(ev);
    const denied = myDenied(ev);
    const panel = actionPanel?.eventId === ev.id ? actionPanel : null;

    return (
      <View style={st.controlsSection}>
        {pending && (
          <View style={st.pendingBanner}>
            <Text style={st.pendingText}>
              {pending.type === 'prepone' ? '🍕' : '⏳'} Your request ({pending.type === 'prepone' ? `-${pending.minutes}` : `+${pending.minutes}`} min) is waiting for approval
            </Text>
          </View>
        )}
        {denied.length > 0 && !pending && (
          <View style={st.deniedBanner}>
            <Text style={st.deniedText}>
              Your last request was denied — try a different time
            </Text>
          </View>
        )}
        {!pending && (
          panel ? (
            <View>
              <Text style={st.panelLabel}>
                {panel.mode === 'prepone'
                  ? "🍕 I'm hungry — go sooner by:"
                  : 'Request extra time:'}
              </Text>
              {renderTimeChips(
                async (m) => {
                  await DiningHallService.requestTimeChange(ev.id, user!.uid, m, panel.mode);
                  closePanel();
                },
                panel.mode === 'prepone' ? '#e91e63' : Theme.colors.primary,
                '#fff',
              )}
            </View>
          ) : (
            <View style={st.btnRow}>
              <TouchableOpacity style={st.reqExtendBtn} onPress={() => openPanel(ev.id, 'extend')}>
                <Text style={st.reqExtendText}>Request Extension</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.reqPreponeBtn} onPress={() => openPanel(ev.id, 'prepone')}>
                <Text style={st.reqPreponeText}>🍕 Hungry!</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    );
  };

  const renderParticipants = (ev: DiningHallEvent) => (
    <View style={st.participantsList}>
      <Text style={st.goingLabel}>Going ({ev.participants.length}):</Text>
      {ev.participants.map((uid) => (
        <View key={uid} style={st.participantRow}>
          <View style={st.dot} />
          <Text style={st.participantName}>{getName(uid)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      <Text style={st.title}>Dining Hall</Text>
      <Text style={st.subtitle}>See who's going and join them</Text>

      {myEvent ? (
        <View style={st.card}>
          <View style={st.cardHeaderRow}>
            <View style={st.badge}><Text style={st.badgeText}>YOUR EVENT</Text></View>
          </View>
          <CountdownTimer targetTime={myEvent.targetTime}
            onComplete={() => DiningHallService.completeEvent(myEvent.id)} />
          {renderParticipants(myEvent)}
          {renderOwnerControls(myEvent)}
          <TouchableOpacity style={st.cancelBtn}
            onPress={() => DiningHallService.completeEvent(myEvent.id)}
          ><Text style={st.cancelBtnText}>Cancel Event</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={st.card}>
          <Text style={st.cardTitle}>Going soon?</Text>
          <Text style={st.cardSub}>Let everyone know when you're heading to the dining hall</Text>
          <View style={st.timeButtons}>
            {[15, 30].map((m) => (
              <TouchableOpacity key={m} style={[st.timeBtn, creating && st.disabled]}
                onPress={() => handleCreate(m)} disabled={creating}
              ><Text style={st.timeBtnText}>{m} min</Text></TouchableOpacity>
            ))}
            <TouchableOpacity style={[st.timeBtn, st.timeBtnOutline, creating && st.disabled]}
              onPress={() => setShowCustom(!showCustom)} disabled={creating}
            ><Text style={[st.timeBtnText, st.timeBtnOutlineText]}>Custom</Text></TouchableOpacity>
          </View>
          {showCustom && (
            <View style={st.customRow}>
              <TextInput style={st.customInput} placeholder="Minutes"
                keyboardType="numeric" value={customMinutes} onChangeText={setCustomMinutes} />
              <TouchableOpacity style={[st.customGo, !customMinutes && st.disabled]}
                onPress={() => { const n = parseInt(customMinutes, 10); if (n > 0) handleCreate(n); }}
                disabled={!customMinutes || creating}
              ><Text style={st.customGoText}>Go</Text></TouchableOpacity>
            </View>
          )}
          {creating && <ActivityIndicator style={{ marginTop: 12 }} color={Theme.colors.primary} />}
        </View>
      )}

      {otherEvents.length > 0 && (
        <Text style={st.sectionTitle}>Active Events ({otherEvents.length})</Text>
      )}

      {otherEvents.map((ev) => {
        const joined = ev.participants.includes(user?.uid || '');
        return (
          <View key={ev.id} style={st.card}>
            <View style={st.eventHeader}>
              <Text style={st.creatorName}>{names[ev.creatorId] || ev.creatorName}</Text>
              <Text style={st.creatorSub}>is heading to the dining hall</Text>
            </View>
            <CountdownTimer targetTime={ev.targetTime} />
            {renderParticipants(ev)}
            {joined && renderParticipantControls(ev)}
            {joined ? (
              <TouchableOpacity style={st.leaveBtn}
                onPress={() => DiningHallService.leaveEvent(ev.id, user!.uid)}
              ><Text style={st.leaveBtnText}>Leave</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={st.joinBtn}
                onPress={() => DiningHallService.joinEvent(ev.id, user!.uid)}
              ><Text style={st.joinBtnText}>Join — I'm going too!</Text></TouchableOpacity>
            )}
          </View>
        );
      })}

      {events.length === 0 && (
        <View style={st.empty}>
          <Text style={st.emptyIcon}>🍽️</Text>
          <Text style={st.emptyText}>No one's going right now</Text>
          <Text style={st.emptySub}>Be the first — create an event above!</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
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

  // Controls section
  controlsSection: { marginTop: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  extendBtn: { flex: 1, backgroundColor: '#fff3e0', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#ff9800' },
  extendBtnText: { color: '#e65100', fontSize: 15, fontWeight: '600' },
  preponeBtn: { flex: 1, backgroundColor: '#fce4ec', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e91e63' },
  preponeBtnText: { color: '#880e4f', fontSize: 15, fontWeight: '600' },

  reqExtendBtn: { flex: 1, backgroundColor: '#e3f2fd', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: Theme.colors.primary },
  reqExtendText: { color: Theme.colors.primary, fontSize: 14, fontWeight: '600' },
  reqPreponeBtn: { flex: 1, backgroundColor: '#fce4ec', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e91e63' },
  reqPreponeText: { color: '#880e4f', fontSize: 14, fontWeight: '600' },

  // Chip picker
  panelLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  chipText: { fontSize: 14, fontWeight: '700' },
  customReqRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  customReqInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10, fontSize: 15 },
  customReqGo: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  customReqGoText: { fontSize: 14, fontWeight: '700' },
  chipCancelBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f0f0f0', borderRadius: 10 },
  chipCancelText: { color: Theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },

  // Banners
  pendingBanner: { backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ffc107', marginBottom: 10 },
  pendingText: { color: '#f57f17', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  deniedBanner: { backgroundColor: '#fce4ec', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ef9a9a' },
  deniedText: { color: '#c62828', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Owner incoming requests
  requestsBox: { backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ffc107' },
  requestsTitle: { fontSize: 14, fontWeight: '700', color: '#f57f17', marginBottom: 10 },
  reqRow: { marginBottom: 10 },
  reqText: { fontSize: 14, color: Theme.colors.text, fontWeight: '600', marginBottom: 6 },
  reqActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: Theme.colors.success, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  denyBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.danger, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  denyBtnText: { color: Theme.colors.danger, fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Theme.colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 6 },
});
