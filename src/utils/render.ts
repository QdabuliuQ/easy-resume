import { StyleSheet } from '@react-pdf/renderer';

export default StyleSheet.create({
  page: { padding: 20 },
  info1_wrapper: {
    width: '390px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info1_wrapper_left: {
    width: '300px',
    textAlign: 'left',
  },
  info1_wrapper_right: {
    width: '90px',
  },
  info1_wrapper_name_wrapper: {
    width: '100%',
  },
  info1_wrapper_name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
});
