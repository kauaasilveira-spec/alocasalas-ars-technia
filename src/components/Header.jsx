import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from '../styles/Header';

import LogoEstrela from '../../assets/LogoCamera.png';
import SolicitacoesIcon from '../../assets/Solicitacoes.png';
import PerfilIcon from '../../assets/Perfil.png';

export default function Header({ nomeUsuario = 'Alexia Vitória' }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandContainer}>
        <Image 
          source={LogoEstrela} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>Minhas salas</Text>
          <Text style={styles.brandSubtitle}>GESTÃO</Text>
        </View>
      </View>

      <View style={styles.userProfile}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
          <Image
            source={SolicitacoesIcon}
            style={styles.notificationIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <View style={styles.avatarCircle}>
          <Image
            source={PerfilIcon}
            style={styles.avatarIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.userName}>{nomeUsuario}</Text>
      </View>
    </View>
  );
}
