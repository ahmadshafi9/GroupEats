import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export const placeDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeHeader: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  placeName: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
  },
  placeAddress: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  writeReviewButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  writeReviewText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  section: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  reviewCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
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
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  userName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  friendBadge: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  meBadge: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.success,
    fontWeight: Theme.fontWeight.semibold,
  },
  reviewDate: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  ratingBadge: {
    backgroundColor: Theme.colors.gold,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.md,
  },
  ratingText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.md,
  },
  reviewText: {
    fontSize: Theme.fontSize.sm,
    lineHeight: 22,
    color: Theme.colors.text,
  },
  emptyState: {
    backgroundColor: Theme.colors.surface,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textTertiary,
  },
});

