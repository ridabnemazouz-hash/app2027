import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ReaderScreen } from '../../src/screens/library';
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReaderScreen id={id} />;
}
