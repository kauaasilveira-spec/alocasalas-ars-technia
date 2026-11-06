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
  // MENU DESKTOP
  menu: {
    width: 145,
    backgroundColor: CORES.azul,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  menuTitulo: {
    color: '#FFFFFF',
    fontSize: 9,
    marginBottom: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  itemMenu: {
    minHeight: 35,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  itemSelecionado: {
    backgroundColor: '#F1F0EF',
  },
  iconeMenu: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#FFFFFF',
  },
  iconeSelecionado: {
    tintColor: CORES.azul,
  },
  textoMenu: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
  },
  textoSelecionado: {
    color: CORES.azul,
    fontFamily: 'Montserrat-SemiBold',
  },
  rodapeMenu: {
    position: 'absolute',
    bottom: 18,
    left: 10,
  },
  rodapeTexto: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },
  rodapeVersao: {
    fontSize: 8,
    color: '#D8E8F5',
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },

  // MENU CELULAR (RODAPÉ MOBILE)
  menuCelular: {
    width: '100%',
    height: 65,
    minHeight: 65,
    backgroundColor: CORES.azul,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  itemMenuCelular: {
    flex: 1,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconeMenuCelular: {
    width: 23,
    height: 23,
    tintColor: '#FFFFFF',
  },
  iconeMenuAtivoCelular: {
    tintColor: CORES.destaque,
  },
  textoMenuCelular: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
});

export default styles;