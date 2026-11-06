import { StyleSheet } from 'react-native';

const CORES = {
  fundo: '#A6BCC9',
  azul: '#357DBF',
  verdeBotao: '#C8F2C2',
  rosaBotao: '#E8A5A5',
  amareloBotao: '#F9F095',
  bordaInput: '#D1D5DB',
  fundoInput: '#FFF8F3',
};

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },

  aplicativo: {
    flex: 1,
    backgroundColor: CORES.fundo,
    overflow: 'hidden',
  },

  conteudo: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },

  conteudoCelular: {
    flexDirection: 'column',
  },

  areaPrincipal: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  areaPrincipalCelular: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  conteudoRolavel: {
    paddingBottom: 30,
    alignItems: 'center', // Centraliza o bloco na área principal
  },

  conteudoRolavelCelular: {
    paddingBottom: 20,
    alignItems: 'stretch',
  },

  blocoConteudo: {
    width: '100%',
    maxWidth: 950, // Aumentado para ocupar melhor a tela em Monitores/Desktop
    alignSelf: 'center',
  },

  tagGestao: {
    fontSize: 11,
    fontWeight: 'bold',
    color: CORES.azul,
    letterSpacing: 1,
    marginBottom: 4,
  },

  tituloPrincipal: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },

  subtitulo: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 20,
  },

  cartaoFormulario: {
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  rotulo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },

  containerInput: {
    backgroundColor: CORES.fundoInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.bordaInput,
    marginBottom: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    height: 44,
  },

  containerAreaTexto: {
    height: 110,
    paddingVertical: 10,
    marginBottom: 24,
  },

  input: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },

  areaTexto: {
    height: '100%',
  },

  botaoAceitar: {
    backgroundColor: CORES.verdeBotao,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  botaoNegar: {
    backgroundColor: CORES.rosaBotao,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  botaoRevisao: {
    backgroundColor: CORES.amareloBotao,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoBotao: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
});

export default styles;