import React from 'react';
import { AppProvider } from '../context/context';
import DetalhesdoLocal from '../screens/DetalhesdoLocal';

export default function App() {
  return (
    <AppProvider>
      <DetalhesdoLocal />
    </AppProvider>
  );
}