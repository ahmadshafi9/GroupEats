import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export const exploreStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
  map: {
    flex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.fontSize.md,
    ...Theme.shadow.large,
  },
  clearButton: {
    position: 'absolute',
    right: Theme.spacing.md,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.textSecondary,
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: Theme.spacing.lg,
    width: 50,
    height: 50,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow.large,
  },
  locationButtonText: {
    fontSize: Theme.fontSize.xxl,
  },
  legend: {
    position: 'absolute',
    top: 70,
    left: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    ...Theme.shadow.large,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Theme.spacing.sm,
  },
  legendText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.text,
  },
  callout: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 4,
  },
  calloutRating: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  calloutFriend: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.success,
    fontWeight: Theme.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalPlaceName: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 5,
  },
  modalPlaceAddress: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.round,
  },
  closeButtonText: {
    fontSize: Theme.fontSize.xl,
    color: Theme.colors.textSecondary,
  },
  modalStats: {
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
  reviewsList: {
    maxHeight: 300,
  },
  reviewsTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.md,
  },
  miniReview: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  miniImage: {
    width: 80,
    height: 80,
  },
  miniReviewContent: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  miniReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  miniReviewUser: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
  },
  friendBadge: {
    color: Theme.colors.success,
  },
  miniReviewRating: {
    fontSize: Theme.fontSize.xs,
  },
  miniReviewText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
  viewAllButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  viewAllButtonText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  statsBar: {
    position: 'absolute',
    bottom: Theme.spacing.md,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    ...Theme.shadow.large,
  },
  statsText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
});

