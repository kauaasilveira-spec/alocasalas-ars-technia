import { StyleSheet } from 'react-native';

const CORES = {
  azul: '#357DBF',
  azulEscuro: '#285D8C',
  fundo: '#A6BCC9',
  creme: '#FFF4EB',
  branco: '#F1F0EF',
  texto: '#171717',
  rosa: '#D9A4A4',
  verde: '#B6D6A7',
  amarelo: '#F0E27A',
  roxo: '#3E4BCC',
  destaque: '#FFCEAB',
};

export const styles = StyleSheet.create({
  // TELA GERAL
  tela: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  aplicativo: {
    flex: 1,
    backgroundColor: CORES.fundo,
    overflow: 'hidden',
  },

  // CONTEÚDO GERAL
  conteudo: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  areaPrincipal: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  conteudoRolavel: {
    paddingBottom: 25,
  },
  ola: {
    fontSize: 13,
    color: CORES.texto,
    marginBottom: 5,
    fontFamily: 'Montserrat-Regular',
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#101010',
  },
  busca: {
    flex: 1,
    minWidth: 0,
    height: 35,
    borderWidth: 1,
    borderColor: '#B5C3CD',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },
  lupa: {
    color: CORES.azulEscuro,
    fontSize: 21,
    marginRight: 6,
  },
  inputBusca: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 11,
    color: '#222222',
    fontFamily: 'Montserrat-Regular',
  },

  // FILTROS
  linhaFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  listaFiltros: {
    flex: 1,
    minWidth: 0,
  },
  filtrosConteudo: {
    alignItems: 'center',
  },
  filtro: {
    borderWidth: 1,
    borderColor: '#B6BEC3',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 15,
    paddingHorizontal: 12,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  filtroAtivo: {
    backgroundColor: CORES.azul,
    borderColor: CORES.azul,
  },
  textoFiltro: {
    color: '#171717',
    fontSize: 10,
    fontFamily: 'Montserrat-Regular',
  },
  textoFiltroAtivo: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },

  // RESULTADOS & CARTÕES
  resultadosCabecalho: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultadosTitulo: {
    color: '#111111',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
  verTodas: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#111111',
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cartao: {
    width: '48.5%',
    minHeight: 90,
    backgroundColor: 'rgba(241,240,239,0.8)',
    borderColor: '#B5C1CA',
    borderWidth: 1,
    borderRadius: 9,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  cartaoConteudo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  etiquetaTexto: {
    color: '#171717',
    fontSize: 9,
    fontFamily: 'Montserrat-Regular',
  },
  etiquetaReservada: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
  },
  nomeSala: {
    color: '#151515',
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  detalheSala: {
    color: '#414141',
    fontSize: 9,
    fontFamily: 'Montserrat-Regular',
  },
  semResultados: {
    color: '#333333',
    fontSize: 13,
    paddingVertical: 20,
    fontFamily: 'Montserrat-Regular',
  },

  // RESPONSIVIDADE CELULAR
  conteudoCelular: {
    flexDirection: 'column',
  },
  areaPrincipalCelular: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    minHeight: 0,
  },
  conteudoRolavelCelular: {
    paddingBottom: 20,
  },
  linhaTituloCelular: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  linhaFiltrosCelular: {
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  filtrosMobile: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 7,
  },
  gradeCelular: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
  },
  cartaoCelular: {
    width: '100%',
    minHeight: 78,
    marginBottom: 10,
    padding: 12,
  },
});

export default styles;