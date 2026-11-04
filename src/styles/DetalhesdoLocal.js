import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100vh',
    width: '100%',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: '4%',
    paddingVertical: 25,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  categoryTag: {
    fontFamily: 'Montserrat_700Bold',
    color: '#357DBF',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 15,
    color: '#555555',
    marginBottom: 25,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: '4%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Montserrat_400Regular',
    backgroundColor: '#FFF4EB',
    borderWidth: 1,
    borderColor: '#EAD7C5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333333',
    width: '100%',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  buttonStack: {
    marginTop: 15,
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnAccept: {
    backgroundColor: '#D4F8C4',
  },
  btnDeny: {
    backgroundColor: '#F5B7B1',
  },
  btnReview: {
    backgroundColor: '#FFF59D',
  },
  btnText: {
    fontFamily: 'Montserrat_700Bold',
    color: '#1A1A1A',
    fontSize: 15,
  },
});