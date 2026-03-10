import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.surface,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.xxl,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.fontSize.md,
    backgroundColor: Theme.colors.surface,
  },
  buttonRow: {
    marginTop: Theme.spacing.lg,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.round,
    alignItems: 'center' as const,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    color: Theme.colors.primary,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  debugText: {
    marginTop: Theme.spacing.xl,
    textAlign: 'center',
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textTertiary,
  },
});

