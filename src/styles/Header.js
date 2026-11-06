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
  cabecalho: {
    minHeight: 48,
    backgroundColor: '#F0EFEE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  logo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imagemLogo: {
    width: 34,
    height: 34,
  },
  marca: {
    justifyContent: 'center',
  },
  marcaTitulo: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: CORES.azul,
  },
  marcaSubtitulo: {
    fontSize: 8,
    fontFamily: 'Montserrat-Regular',
    color: CORES.azul,
    marginTop: 2,
  },
  espaco: {
    flex: 1,
  },
  sino: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#E3D2B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  avatarIcone: {
    width: 20,
    height: 20,
    tintColor: CORES.azul,
  },
  usuario: {
    color: CORES.azul,
    fontSize: 10,
    fontFamily: 'Montserrat-Regular',
  },
});

export default styles;