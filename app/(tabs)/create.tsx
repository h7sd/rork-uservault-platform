import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import colors from '@/constants/colors';

export default function CreatePlaceholder() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        router.push('/create-post');
      }, 100);
      return () => clearTimeout(timer);
    }, [router])
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.dark.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
