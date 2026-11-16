import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { WordScreen } from '../../src/screens/vocabulary';
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WordScreen id={id} />;
}
