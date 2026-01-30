import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export const feedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  emptyText: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textTertiary,
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  postCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    overflow: 'hidden',
    ...Theme.shadow.medium,
  },
  postHeader: {
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.round,
    marginRight: Theme.spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  userName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  postDate: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postContent: {
    padding: Theme.spacing.lg,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  placeName: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    flex: 1,
    color: Theme.colors.primary,
  },
  placeAddress: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Theme.fontSize.md,
    marginRight: 5,
  },
  ratingNumber: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textSecondary,
  },
  description: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  locationIcon: {
    fontSize: Theme.fontSize.md,
    marginRight: 5,
  },
  locationText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingTop: Theme.spacing.md,
    gap: Theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
});

