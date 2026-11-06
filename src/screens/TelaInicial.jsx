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
import CardSala from '../components/CardSala';
import styles from '../styles/TelaInicial';

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

const filtros = ['Todos', 'Abertas', 'Reservadas', 'Em manutenção', 'Fechadas'];

export default function TelaInicial({ onNavegar }) {
  const { width } = useWindowDimensions();
  const celular = width <= 600;

  const [filtro, setFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');

  const salasFiltradas = salasIniciais.filter((item) => {
    const correspondeBusca = item.sala.toLowerCase().includes(busca.toLowerCase());
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

      <View style={styles.aplicativo}>
        {!celular && <Header />}

        <View style={[styles.conteudo, celular && styles.conteudoCelular]}>
          {!celular && <Sidebar celular={celular} onNavegar={onNavegar} />}

          <LinearGradient
            colors={['#FFF4EB', '#A6BCC9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.areaPrincipal, celular && styles.areaPrincipalCelular]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.conteudoRolavel,
                celular && styles.conteudoRolavelCelular,
              ]}
            >
              <Text style={styles.ola}>Olá, Alexia</Text>

              <View style={[styles.linhaTitulo, celular && styles.linhaTituloCelular]}>
                <Text style={styles.tituloPrincipal}>Minhas salas</Text>

                <View style={styles.busca}>
                  <Text style={styles.lupa}>⌕</Text>
                  <TextInput
                    style={styles.inputBusca}
                    placeholder="Buscar por salas, eventos e aulas"
                    placeholderTextColor="#454545"
                    value={busca}
                    onChangeText={setBusca}
                  />
                </View>
              </View>

              <View style={[styles.linhaFiltros, celular && styles.linhaFiltrosCelular]}>
                {celular ? (
                  <View style={styles.filtrosMobile}>
                    {filtros.map((nome) => (
                      <TouchableOpacity
                        key={nome}
                        onPress={() => setFiltro(nome)}
                        style={[styles.filtro, filtro === nome && styles.filtroAtivo]}
                      >
                        <Text style={[styles.textoFiltro, filtro === nome && styles.textoFiltroAtivo]}>
                          {nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
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
                        style={[styles.filtro, filtro === nome && styles.filtroAtivo]}
                      >
                        <Text style={[styles.textoFiltro, filtro === nome && styles.textoFiltroAtivo]}>
                          {nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.resultadosCabecalho}>
                <Text style={styles.resultadosTitulo}>Resultados</Text>
                <TouchableOpacity onPress={() => setFiltro('Todos')}>
                  <Text style={styles.verTodas}>Ver todas</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.grade, celular && styles.gradeCelular]}>
                {salasFiltradas.map((item) => (
                  <CardSala key={item.id} item={item} celular={celular} />
                ))}

                {salasFiltradas.length === 0 && (
                  <Text style={styles.semResultados}>Nenhuma sala encontrada.</Text>
                )}
              </View>
            </ScrollView>
          </LinearGradient>

          {celular && <Sidebar celular={celular} onNavegar={onNavegar} />}
        </View>
      </View>
    </View>
  );
}