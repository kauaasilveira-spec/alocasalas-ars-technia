import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { styles } from '../styles/DetalhesdoLocal';
import { useApp } from '../context/context';

export default function DetalhesdoLocal() {
  const { solicitacaoAtual, atualizarStatusSolicitacao } = useApp();

  return (
    <View style={styles.layout}>
      <Sidebar />

      {/* Uso direto da propriedade CSS 'background' para forçar o gradiente no browser */}
      <View
        style={[
          styles.mainContent,
          { background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF4EB 100%)' }
        ]}
      >
        <Header nomeUsuario="Aléxia Victória" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.categoryTag}>GESTÃO</Text>
          <Text style={styles.pageTitle}>Verificação de Agendamento</Text>
          <Text style={styles.pageSubtitle}>
            Informações de solicitação de Agendamento, verifique-as
          </Text>

          {/* Card Branco Principal */}
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome do professor *</Text>
              <TextInput
                style={styles.input}
                value={solicitacaoAtual?.professor || 'Ex.: Marcos/Caique'}
                editable={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quantidade alunos *</Text>
              <TextInput
                style={styles.input}
                value={
                  solicitacaoAtual?.qtdAlunos
                    ? `Ex.: Máx.${solicitacaoAtual.qtdAlunos}`
                    : 'Ex.: Máx.20'
                }
                editable={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Local / Setor *</Text>
              <TextInput
                style={styles.input}
                value={solicitacaoAtual?.local || 'Ex.: Sala 02 / Administração'}
                editable={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Descrição do evento *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value="Ex.: Local reservado para aulas práticas[...]"
                multiline
                editable={false}
              />
            </View>

            {/* Botões de Ação */}
            <View style={styles.buttonStack}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnAccept]}
                onPress={() => atualizarStatusSolicitacao('Aceito')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Aceitar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDeny]}
                onPress={() => atualizarStatusSolicitacao('Negado')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Negar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnReview]}
                onPress={() => atualizarStatusSolicitacao('Em Revisão')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Em Revisão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}