import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from '../styles/Sidebar';

import InicioIcon from '../../assets/Inicio.png';
import ReservasIcon from '../../assets/Reservas.png';
import SalasIcon from '../../assets/Salas.png';
import SolicitacoesIcon from '../../assets/Solicitacoes.png';
import PerfilIcon from '../../assets/Perfil.png';

const itensMenu = [
  { nome: 'Início', icone: InicioIcon },
  { nome: 'Reservas', icone: ReservasIcon },
  { nome: 'Salas', icone: SalasIcon },
  { nome: 'Solicitações', icone: SolicitacoesIcon },
];

export default function Sidebar({ isMobile }) {
  if (isMobile) {
    return (
      <View style={styles.menuMobile}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuMobileContent}
        >
          {itensMenu.map((item, index) => (
            <TouchableOpacity
              key={item.nome}
              style={[
                styles.itemMenuMobile,
                index === 0 && styles.itemSelecionadoMobile,
              ]}
              activeOpacity={0.75}
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
                {item.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.menu}>
      <View>
        <Text style={styles.menuTitulo}>MENU PRINCIPAL</Text>

        {itensMenu.map((item, index) => (
          <TouchableOpacity
            key={item.nome}
            style={[
              styles.itemMenu,
              index === 0 && styles.itemSelecionado,
            ]}
            activeOpacity={0.75}
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
              {item.nome}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.itemMenu} activeOpacity={0.75}>
          <Image
            source={PerfilIcon}
            style={styles.iconeMenu}
            resizeMode="contain"
          />
          <Text style={styles.textoMenu}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rodapeMenu}>
        <Text style={styles.rodapeTexto}>Portal do professor</Text>
      </View>
    </View>
  );
}