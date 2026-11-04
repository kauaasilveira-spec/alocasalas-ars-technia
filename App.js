import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from './src/context/context';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import TelaInicial from './src/screens/TelaInicial';
import DetalhesdoLocal from './src/screens/DetalhesdoLocal';

function Roteador() {
  const { telaAtual } = useApp();

  switch (telaAtual) {
    case 'Inicio':
      return <TelaInicial />;
    case 'DetalhesdoLocal':
      return <DetalhesdoLocal />;
    default:
      return <TelaInicial />;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#2878C5" />
      </View>
    );
  }

  return (
    <AppProvider>
      <Roteador />
    </AppProvider>
  );
}
