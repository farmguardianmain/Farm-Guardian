import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useCattleStore } from '../../store';
import { colors, typography } from '../../theme';

const AddCattleScreen = () => {
  const navigation = useNavigation();
  const { createCattle, isLoading } = useCattleStore();
  
  const [formData, setFormData] = useState({
    tag_id: '',
    name: '',
    breed: 'holstein',
    date_of_birth: '',
    weight: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const breeds = [
    { key: 'holstein', label: 'Holstein' },
    { key: 'jersey', label: 'Jersey' },
    { key: 'brown_swiss', label: 'Brown Swiss' },
    { key: 'guernsey', label: 'Guernsey' },
    { key: 'ayrshire', label: 'Ayrshire' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tag_id.trim()) {
      newErrors.tag_id = 'Tag ID is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Valid weight is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const cattleData = {
        tag_id: formData.tag_id.trim(),
        name: formData.name.trim(),
        breed: formData.breed,
        date_of_birth: new Date(formData.date_of_birth).toISOString(),
        weight: parseFloat(formData.weight),
        notes: formData.notes.trim(),
      };

      const success = await createCattle(cattleData);
      
      if (success) {
        Alert.alert(
          'Success',
          'Cattle record created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create cattle record');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const BreedSelector = () => (
    <View style={styles.breedContainer}>
      <Text style={styles.label}>Breed</Text>
      <View style={styles.breedGrid}>
        {breeds.map(breed => (
          <TouchableOpacity
            key={breed.key}
            style={[
              styles.breedOption,
              formData.breed === breed.key && styles.breedOptionSelected
            ]}
            onPress={() => updateFormData('breed', breed.key)}
          >
            <Text style={[
              styles.breedText,
              formData.breed === breed.key && styles.breedTextSelected
            ]}>
              {breed.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Add New Cattle</Text>

        {/* Tag ID */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tag ID *</Text>
          <TextInput
            style={[styles.input, errors.tag_id && styles.inputError]}
            value={formData.tag_id}
            onChangeText={(value) => updateFormData('tag_id', value)}
            placeholder="Enter tag ID"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
          />
          {errors.tag_id && <Text style={styles.errorText}>{errors.tag_id}</Text>}
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Enter cattle name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Breed */}
        <BreedSelector />

        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={[styles.input, errors.date_of_birth && styles.inputError]}
            value={formData.date_of_birth}
            onChangeText={(value) => updateFormData('date_of_birth', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth}</Text>}
        </View>

        {/* Weight */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={[styles.input, errors.weight && styles.inputError]}
            value={formData.weight}
            onChangeText={(value) => updateFormData('weight', value)}
            placeholder="Enter weight in kg"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
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
            <Text style={styles.submitButtonText}>Create Cattle Record</Text>
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
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: 32,
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
  breedContainer: {
    marginBottom: 20,
  },
  breedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breedOption: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    minWidth: 100,
    alignItems: 'center',
  },
  breedOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  breedText: {
    ...typography.body,
    color: colors.text,
  },
  breedTextSelected: {
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

export default AddCattleScreen;
