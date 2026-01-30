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
});

