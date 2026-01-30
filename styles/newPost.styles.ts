import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export const newPostStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  scrollView: {
    flex: 1,
    padding: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.xl,
  },
  searchSection: {
    marginBottom: Theme.spacing.xl,
    zIndex: 1000,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.md,
    paddingHorizontal: Theme.spacing.lg,
    height: 50,
  },
  selectedPlace: {
    backgroundColor: '#e8f5e9',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.xl,
  },
  selectedPlaceName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: 5,
  },
  selectedPlaceAddress: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  imageSection: {
    marginBottom: Theme.spacing.xl,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  placeholderText: {
    color: Theme.colors.textTertiary,
    fontSize: Theme.fontSize.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  imageButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  ratingSection: {
    marginBottom: Theme.spacing.xl,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  ratingButton: {
    flex: 1,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: Theme.colors.gold,
  },
  ratingButtonText: {
    fontSize: Theme.fontSize.sm,
  },
  descriptionSection: {
    marginBottom: Theme.spacing.xl,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.md,
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Theme.colors.success,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.textTertiary,
  },
  submitButtonText: {
    color: Theme.colors.surface,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  suggestionsContainer: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    maxHeight: 200,
    marginTop: 5,
    zIndex: 1000,
    ...Theme.shadow.large,
  },
  suggestionItem: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  suggestionName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text,
  },
  suggestionAddress: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
    marginTop: 3,
  },
});

