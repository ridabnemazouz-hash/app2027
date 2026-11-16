import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LearningProvider } from '../src/state';
export default function Root() {
  return (
    <SafeAreaProvider>
      <LearningProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </LearningProvider>
    </SafeAreaProvider>
  );
}
