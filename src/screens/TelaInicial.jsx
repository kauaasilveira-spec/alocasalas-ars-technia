import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { styles } from '../styles/TelaInicial';

const CORES = {
  azul: '#357DBF',
  verde: '#B6D6A7',
  rosa: '#D9A4A4',
  amarelo: '#F0E27A',
  roxo: '#3E4BCC',
};

const salasIniciais = [
  { id: 1, status: 'Reservada', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 2, status: 'Fechada', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 3, status: 'Fechada', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 4, status: 'Reservada', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 5, status: 'Aberta', sala: 'Sala 18 - Redes de Computação', professor: 'Professor Patrick', capacidade: 20 },
  { id: 6, status: 'Manutenção', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 7, status: 'Manutenção', sala: 'Sala 15 - Desenvolvimento de Sistemas', professor: 'Professor Eduardo', capacidade: 30 },
  { id: 8, status: 'Aberta', sala: 'Sala 18 - Redes de Computação', professor: 'Professor Patrick', capacidade: 20 },
];

const filtros = [
  'Todos',
  'Abertas',
  'Reservadas',
  'Em manutenção',
  'Fechadas',
];

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

export default function TelaInicial() {
  const [filtro, setFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [salas] = useState(salasIniciais);

  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const salasFiltradas = salas.filter((item) => {
    const correspondeBusca = item.sala
      .toLowerCase()
      .includes(busca.toLowerCase());

    const correspondeFiltro =
      filtro === 'Todos' ||
      (filtro === 'Abertas' && item.status === 'Aberta') ||
      (filtro === 'Reservadas' && item.status === 'Reservada') ||
      (filtro === 'Em manutenção' && item.status === 'Manutenção') ||
      (filtro === 'Fechadas' && item.status === 'Fechada');

    return correspondeBusca && correspondeFiltro;
  });

  return (
    <View style={styles.tela}>
      <StatusBar barStyle="dark-content" />

      <Header />

      <View style={[styles.conteudo, isMobile && { flexDirection: 'column' }]}>
        <Sidebar isMobile={isMobile} />

        <LinearGradient
          colors={['#FFF4EB', '#A6BCC9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.areaPrincipal}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conteudoRolavel}
          >
            <Text style={styles.ola}>Olá, Alexia</Text>

            <View style={styles.linhaTitulo}>
              <Text style={styles.tituloPrincipal}>Minhas salas</Text>

              <View style={styles.busca}>
                <Text style={styles.lupa}>⌕</Text>
                <TextInput
                  style={styles.inputBusca}
                  placeholder="Buscar por salas, eventos e aulas"
                  placeholderTextColor="#64748B"
                  value={busca}
                  onChangeText={setBusca}
                />
              </View>
            </View>

            <View style={styles.linhaFiltros}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.listaFiltros}
                contentContainerStyle={styles.filtrosConteudo}
              >
                {filtros.map((nome) => (
                  <TouchableOpacity
                    key={nome}
                    onPress={() => setFiltro(nome)}
                    style={[
                      styles.filtro,
                      filtro === nome && styles.filtroAtivo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoFiltro,
                        filtro === nome && styles.textoFiltroAtivo,
                      ]}
                    >
                      {nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.resultadosCabecalho}>
              <Text style={styles.resultadosTitulo}>Resultados</Text>

              <TouchableOpacity onPress={() => setFiltro('Todos')}>
                <Text style={styles.verTodas}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.grade}>
              {salasFiltradas.map((item) => (
                <View style={styles.cartao} key={item.id}>
                  <View style={styles.cartaoConteudo}>
                    <View
                      style={[
                        styles.etiqueta,
                        { backgroundColor: corStatus(item.status) },
                      ]}
                    >
                      <Text style={styles.etiquetaTexto}>{item.status}</Text>
                    </View>

                    <Text style={styles.nomeSala} numberOfLines={2}>
                      {item.sala}
                    </Text>

                    <Text style={styles.detalheSala} numberOfLines={1}>
                      {item.professor} - Máx. {item.capacidade}
                    </Text>
                  </View>
                </View>
              ))}

              {salasFiltradas.length === 0 && (
                <Text style={styles.semResultados}>
                  Nenhuma sala encontrada.
                </Text>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}