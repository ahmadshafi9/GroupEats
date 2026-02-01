import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

type CountdownTimerProps = {
  targetTime: string; // ISO timestamp
  onComplete?: () => void;
};

export function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    total: number;
  }>({ minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 });
        onComplete?.();
        return;
      }

      const minutes = Math.floor(difference / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);

      setTimeLeft({ minutes, seconds, total: difference });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (timeLeft.total <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.timeText}>Time's up! 🍽️</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time until dining hall:</Text>
      <View style={styles.timeContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{formatTime(timeLeft.minutes)}</Text>
          <Text style={styles.timeUnit}>MIN</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{formatTime(timeLeft.seconds)}</Text>
          <Text style={styles.timeUnit}>SEC</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  timeBox: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.surface,
  },
  timeUnit: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.surface,
    marginTop: Theme.spacing.xs,
  },
  separator: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text,
  },
  timeText: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.success,
  },
});
