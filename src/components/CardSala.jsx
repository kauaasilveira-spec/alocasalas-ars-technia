import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/TelaInicial';

const CORES = {
  verde: '#B6D6A7',
  rosa: '#D9A4A4',
  amarelo: '#F0E27A',
  roxo: '#3E4BCC',
};

function corStatus(status) {
  switch (status) {
    case 'Reservada':
      return CORES.roxo;
    case 'Aberta':
      return CORES.verde;
    case 'Fechada':
      return CORES.rosa;
    case 'Manutenção':
      return CORES.amarelo;
    default:
      return '#DDDDDD';
  }
}

export default function CardSala({ item, celular }) {
  return (
    <View style={[styles.cartao, celular && styles.cartaoCelular]}>
      <View style={styles.cartaoConteudo}>
        <View
          style={[
            styles.etiqueta,
            { backgroundColor: corStatus(item.status) },
          ]}
        >
          <Text
            style={[
              styles.etiquetaTexto,
              item.status === 'Reservada' && styles.etiquetaReservada,
            ]}
          >
            {item.status}
          </Text>
        </View>

        <Text style={styles.nomeSala} numberOfLines={2}>
          {item.sala}
        </Text>

        <Text style={styles.detalheSala} numberOfLines={1}>
          {item.professor} - Máx. {item.capacidade}
        </Text>
      </View>
    </View>
  );
}