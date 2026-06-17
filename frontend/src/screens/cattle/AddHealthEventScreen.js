import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ApiService from '../../services/api';
import { colors, typography } from '../../theme';

const AddHealthEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cattleId } = route.params || {};

  const [formData, setFormData] = useState({
    event_type: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.event_type.trim()) newErrors.event_type = 'Event type required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await ApiService.addHealthEvent(cattleId, {
        event_type: formData.event_type.trim(),
        notes: formData.notes.trim(),
        date: new Date().toISOString(),
      });
      // After logging, evaluate health metrics
      try {
        const cattleData = await ApiService.getCattleDetail(cattleId);
        const alerts = [];
        if (cattleData?.weight && cattleData.weight > 900) {
          alerts.push('Cow is overweight');
        } else if (cattleData?.weight && cattleData.weight < 450) {
          alerts.push('Cow is underweight');
        }
        if (alerts.length > 0) {
          Alert.alert('Health Alert', alerts.join('\n'));
        }
      } catch (e) {
        console.error('Metric check error', e);
      }
      Alert.alert('Success', 'Health event logged');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to log health event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Type *</Text>
        <TextInput
          style={[styles.input, errors.event_type && styles.inputError]}
          value={formData.event_type}
          onChangeText={v => setFormData(p => ({ ...p, event_type: v }))}
          placeholder="e.g. Underweight"
          placeholderTextColor={colors.textSecondary}
        />
        {errors.event_type && <Text style={styles.errorText}>{errors.event_type}</Text>}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={v => setFormData(p => ({ ...p, notes: v }))}
          placeholder="Additional details"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitButtonText}>Log Health Event</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  inputContainer: { marginBottom: 20 },
  label: { ...typography.caption, color: colors.text },
  input: { backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.textSecondary },
  inputError: { borderColor: colors.critical },
  errorText: { ...typography.caption, color: colors.critical, marginTop: 4 },
  textArea: { height: 100 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { ...typography.body, color: colors.surface, fontWeight: '600' },
});

export default AddHealthEventScreen;
