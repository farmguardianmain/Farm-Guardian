import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

/**
 * A reusable alert modal component.
 * Props:
 *  - visible (bool): controls visibility.
 *  - title (string): modal title.
 *  - message (string): modal message.
 *  - onClose (function): callback when user dismisses.
 */
const AlertModal = ({ visible, title, message, onClose }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.modalContent}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>OK</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
    ...typography.body,
  },
});

export default AlertModal;
