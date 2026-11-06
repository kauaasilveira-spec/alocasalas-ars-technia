import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from '../styles/Sidebar';

const itensMenu = [
  { nome: 'Início', icone: require('../../assets/Inicio.png') },
  { nome: 'Reservadas', icone: require('../../assets/Reservas.png') },
  { nome: 'Salas', icone: require('../../assets/Salas.png') },
  { nome: 'Solicitações', icone: require('../../assets/Solicitacoes.png') },
  { nome: 'Perfil', icone: require('../../assets/Perfil.png') },
];

export default function Sidebar({ celular, onNavegar }) {
  const handlePress = (nome) => {
    if (nome === 'Solicitações' && onNavegar) {
      onNavegar();
    }
  };

  if (celular) {
    return (
      <View style={styles.menuCelular}>
        {itensMenu.map((item, index) => (
          <TouchableOpacity
            key={item.nome}
            style={styles.itemMenuCelular}
            activeOpacity={0.75}
            onPress={() => handlePress(item.nome)}
          >
            <Image
              source={item.icone}
              style={[
                styles.iconeMenuCelular,
                index === 0 && styles.iconeMenuAtivoCelular,
              ]}
              resizeMode="contain"
            />
            <Text style={styles.textoMenuCelular}>
              {item.nome === 'Reservadas' ? 'Reservas' : item.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.menu}>
      <Text style={styles.menuTitulo}>MENU PRINCIPAL</Text>

      {itensMenu.map((item, index) => (
        <TouchableOpacity
          key={item.nome}
          style={[
            styles.itemMenu,
            index === 0 && styles.itemSelecionado,
          ]}
          activeOpacity={0.75}
          onPress={() => handlePress(item.nome)}
        >
          <Image
            source={item.icone}
            style={[
              styles.iconeMenu,
              index === 0 && styles.iconeSelecionado,
            ]}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.textoMenu,
              index === 0 && styles.textoSelecionado,
            ]}
          >
            {item.nome === 'Reservadas' ? 'Reservas' : item.nome}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.rodapeMenu}>
        <Text style={styles.rodapeTexto}>Portal do professor</Text>
      </View>
    </View>
  );
}