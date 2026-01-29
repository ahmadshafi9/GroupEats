import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function TabOneScreen() {
  const [status, setStatus] = useState('Connecting to Firebase...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'test'));
    setStatus('✅ Firebase Connected Successfully!');
    setLoading(false);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setStatus('❌ Firebase Connection Failed: ' + errorMessage);
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GroupEats</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.status}>{status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});