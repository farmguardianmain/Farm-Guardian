import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { useCattleStore } from '../../store';
import { colors, typography } from '../../theme';

const LogMilkScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cattleId } = route.params || {};
  const { cattle } = useCattleStore();
  
  const [formData, setFormData] = useState({
    cattle_id: cattleId || '',
    date: new Date().toISOString().split('T')[0],
    session: 'morning',
    yield_liters: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const sessions = [
    { key: 'morning', label: 'Morning' },
    { key: 'evening', label: 'Evening' },
    { key: 'night', label: 'Night' },
  ];

  useEffect(() => {
    if (cattleId && cattle.length > 0) {
      const selectedCattle = cattle.find(cow => cow.tag_id === cattleId);
      if (selectedCattle) {
        navigation.setOptions({
          title: `Log Milk - ${selectedCattle.name}`,
        });
      }
    }
  }, [cattleId, cattle, navigation]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cattle_id.trim()) {
      newErrors.cattle_id = 'Cattle selection is required';
    }

    if (!formData.yield_liters || parseFloat(formData.yield_liters) <= 0) {
      newErrors.yield_liters = 'Valid milk yield is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const milkData = {
        cattle_id: formData.cattle_id.trim(),
        date: new Date(formData.date).toISOString(),
        session: formData.session,
        yield_liters: parseFloat(formData.yield_liters),
        notes: formData.notes.trim(),
      };

      await ApiService.logMilkSession(milkData);
      
      Alert.alert(
        'Success',
        'Milk session logged successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Log milk error:', error);
      Alert.alert('Error', 'Failed to log milk session');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const SessionSelector = () => (
    <View style={styles.sessionContainer}>
      <Text style={styles.label}>Session *</Text>
      <View style={styles.sessionGrid}>
        {sessions.map(session => (
          <TouchableOpacity
            key={session.key}
            style={[
              styles.sessionOption,
              formData.session === session.key && styles.sessionOptionSelected
            ]}
            onPress={() => updateFormData('session', session.key)}
          >
            <Text style={[
              styles.sessionText,
              formData.session === session.key && styles.sessionTextSelected
            ]}>
              {session.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Cattle Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cattle *</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput, errors.cattle_id && styles.inputError]}
            value={formData.cattle_id}
            editable={false}
          />
          {errors.cattle_id && <Text style={styles.errorText}>{errors.cattle_id}</Text>}
        </View>

        {/* Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={formData.date}
            onChangeText={(value) => updateFormData('date', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Session */}
        <SessionSelector />

        {/* Milk Yield */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Milk Yield (Liters) *</Text>
          <TextInput
            style={[styles.input, errors.yield_liters && styles.inputError]}
            value={formData.yield_liters}
            onChangeText={(value) => updateFormData('yield_liters', value)}
            placeholder="Enter milk yield in liters"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          {errors.yield_liters && <Text style={styles.errorText}>{errors.yield_liters}</Text>}
        </View>

        {/* Notes */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => updateFormData('notes', value)}
            placeholder="Additional notes (optional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Log Milk Session</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    ...typography.caption,
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  readOnlyInput: {
    backgroundColor: colors.textSecondary + '20',
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: colors.critical,
  },
  textArea: {
    height: 100,
  },
  errorText: {
    ...typography.caption,
    color: colors.critical,
    marginTop: 4,
  },
  sessionContainer: {
    marginBottom: 20,
  },
  sessionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  sessionOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sessionText: {
    ...typography.body,
    color: colors.text,
  },
  sessionTextSelected: {
    color: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default LogMilkScreen;
