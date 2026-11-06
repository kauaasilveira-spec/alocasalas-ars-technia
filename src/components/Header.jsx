import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/Header';

export default function Header() {
  return (
    <View style={styles.cabecalho}>
      <View style={styles.logo}>
        <Image
          source={require('../../assets/LogoCamera.png')}
          style={styles.imagemLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.marca}>
        <Text style={styles.marcaTitulo}>Minhas salas</Text>
        <Text style={styles.marcaSubtitulo}>PROFESSOR</Text>
      </View>

      <View style={styles.espaco} />

      <Image
        source={require('../../assets/Solicitacoes.png')}
        style={styles.sino}
        resizeMode="contain"
      />

      <View style={styles.avatar}>
        <Image
          source={require('../../assets/Perfil.png')}
          style={styles.avatarIcone}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.usuario}>Alexia Vitória</Text>
    </View>
  );
}