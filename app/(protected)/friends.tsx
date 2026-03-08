import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { UserProfileService } from '../../services/auth/userProfileService';
import { UserProfile } from '../../types/User';
import type { FriendRequest } from '../../types/User';
import { Theme } from '../../constants/theme';

type Tab = 'friends' | 'requests' | 'find';

export default function Friends() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [requestSenderNames, setRequestSenderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.uid || !userProfile) return;
    try {
      const [users, friends] = await Promise.all([
        UserProfileService.getAllUsers(),
        UserProfileService.getUserProfiles(userProfile.friends || []),
      ]);
      setAllUsers(users.filter((u) => u.uid !== user.uid));
      setFriendProfiles(friends);
    } catch (error) {
      console.error('Error loading users/friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    try {
      const [incoming, outgoing] = await Promise.all([
        UserProfileService.getIncomingFriendRequests(user.uid),
        UserProfileService.getOutgoingFriendRequests(user.uid),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      if (incoming.length > 0) {
        const names = await UserProfileService.getUserProfiles(incoming.map((r) => r.fromUserId));
        const map: Record<string, string> = {};
        names.forEach((p) => { map[p.uid] = p.name; });
        setRequestSenderNames(map);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  }, [user?.uid, userProfile?.friends?.length]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isFriend = (uid: string) => userProfile?.friends?.includes(uid) ?? false;
  const hasOutgoingRequestTo = (uid: string) => outgoingRequests.some((r) => r.toUserId === uid);
  const incomingFrom = (uid: string) => incomingRequests.find((r) => r.fromUserId === uid);

  const handleSendRequest = async (toUserId: string) => {
    if (!user?.uid) return;
    setActionLoading(toUserId);
    try {
      await UserProfileService.sendFriendRequest(user.uid, toUserId);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await UserProfileService.acceptFriendRequest(requestId);
      await refreshProfile();
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await UserProfileService.declineFriendRequest(requestId);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user?.uid) return;
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(friendId);
            try {
              await UserProfileService.removeFriend(user.uid, friendId);
              await UserProfileService.removeFriend(friendId, user.uid);
              await refreshProfile();
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers;

  const renderAvatar = (profile: UserProfile) => {
    if (profile.profilePic) {
      return <Image source={{ uri: profile.profilePic }} style={styles.avatar} />;
    }
    const initials = profile.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{initials || '?'}</Text>
      </View>
    );
  };

  const renderUserCard = (profile: UserProfile, showRemove: boolean) => {
    const isLoading = actionLoading === profile.uid;
    const alreadyFriend = isFriend(profile.uid);
    const requested = hasOutgoingRequestTo(profile.uid);
    const receivedRequest = incomingFrom(profile.uid);

    return (
      <View key={profile.uid} style={styles.userCard}>
        {renderAvatar(profile)}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        ) : showRemove ? (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFriend(profile.uid)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : alreadyFriend ? (
          <View style={styles.friendsBadge}>
            <Text style={styles.friendsBadgeText}>Friends</Text>
          </View>
        ) : receivedRequest ? (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(receivedRequest.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDeclineRequest(receivedRequest.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : requested ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Requested</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(profile.uid)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderIncomingRequestRow = (req: FriendRequest) => {
    const name = requestSenderNames[req.fromUserId] || 'Someone';
    const isLoading = actionLoading === req.id;
    return (
      <View key={req.id} style={styles.userCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>Wants to be your friend</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        ) : (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(req.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDeclineRequest(req.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const requestCount = incomingRequests.length;
  const friendCount = userProfile?.friends?.length ?? 0;
  const friendListForDisplay: UserProfile[] = (userProfile?.friends || []).map((uid) => {
    const p = friendProfiles.find((f) => f.uid === uid);
    return p ?? { uid, name: 'Unknown user', email: '', profilePic: '', friends: [], createdAt: '' };
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            My Friends ({friendCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            Requests {requestCount > 0 ? `(${requestCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'find' && styles.tabActive]}
          onPress={() => setTab('find')}
        >
          <Text style={[styles.tabText, tab === 'find' && styles.tabTextActive]}>
            Find People
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'find' && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'friends' ? (
          friendCount === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Go to Find People to send friend requests, or check Requests to accept pending ones.
              </Text>
              <TouchableOpacity style={styles.findButton} onPress={() => setTab('find')}>
                <Text style={styles.findButtonText}>Find People</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friendListForDisplay.map((p) => renderUserCard(p, true))
          )
        ) : tab === 'requests' ? (
          incomingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtitle}>
                When someone sends you a friend request, it will show up here.
              </Text>
            </View>
          ) : (
            incomingRequests.map(renderIncomingRequestRow)
          )
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'No other users have signed up yet'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((p) => renderUserCard(p, false))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Theme.colors.primary },
  tabText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textSecondary,
  },
  tabTextActive: { color: Theme.colors.primary, fontWeight: Theme.fontWeight.bold },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 14,
    ...Theme.shadow.small,
  },
  searchInput: { flex: 1, height: 46, fontSize: Theme.fontSize.md },
  clearBtn: { padding: 8 },
  clearBtnText: { fontSize: 16, color: Theme.colors.textTertiary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    marginBottom: 10,
    ...Theme.shadow.small,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: Theme.fontWeight.bold },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
  },
  userEmail: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  addButtonText: { color: '#fff', fontWeight: Theme.fontWeight.semibold, fontSize: 14 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  acceptButtonText: { color: '#fff', fontWeight: Theme.fontWeight.semibold, fontSize: 13 },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  declineButtonText: { color: Theme.colors.danger, fontWeight: Theme.fontWeight.semibold, fontSize: 13 },
  pendingBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  pendingBadgeText: { color: '#e65100', fontWeight: Theme.fontWeight.semibold, fontSize: 13 },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  removeButtonText: {
    color: Theme.colors.danger,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: 14,
  },
  friendsBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.round,
  },
  friendsBadgeText: {
    color: '#2e7d32',
    fontWeight: Theme.fontWeight.semibold,
    fontSize: 14,
  },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  findButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.round,
    marginTop: 20,
  },
  findButtonText: { color: '#fff', fontWeight: Theme.fontWeight.bold, fontSize: 16 },
});
