import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { colors, typography } from '../../theme';

const HeatDetectionScreen = () => {
  const navigation = useNavigation();
  const [heatData, setHeatData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiModalCattleId, setAiModalCattleId] = useState(null);
  const [bullReference, setBullReference] = useState('');

  useEffect(() => {
    loadHeatDetection();
  }, []);

  const loadHeatDetection = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getHeatDetection();

      setHeatData(data);
    } catch (error) {
      console.error('Load heat detection error:', error);
      Alert.alert('Error', 'Failed to load heat detection data');
    } finally {
      setIsLoading(false);
    }
  };

  const logAIEvent = (cattleId) => {
    setAiModalCattleId(cattleId);
    setBullReference('');
    setAiModalVisible(true);
  };

  const submitAIEvent = async () => {
    if (!bullReference || !bullReference.trim()) {
      Alert.alert('Error', 'Bull/semen reference is required');
      return;
    }
    setAiModalVisible(false);
    try {
      const aiData = {
        cattle_id: aiModalCattleId,
        bull_semen_reference: bullReference.trim(),
        date: new Date().toISOString(),
        notes: '',
      };
      await ApiService.logAIEvent(aiData);
      Alert.alert(
        'Success',
        'AI event logged successfully',
        [{ text: 'OK', onPress: () => loadHeatDetection() }]
      );
    } catch (error) {
      console.error('Log AI event error:', error);
      Alert.alert('Error', 'Failed to log AI event');
    }
  };

  const dismissHeatAlert = async (cattleId) => {
    try {
      // In a real implementation, you'd have a specific endpoint for this
      Alert.alert(
        'Dismiss Heat Alert',
        'This will mark the heat detection as handled. Continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Dismiss',
            onPress: () => {
              // Remove from local state
              setHeatData(prev => prev.filter(item => item.cattle_id !== cattleId));
            },
          },
        ]
      );
    } catch (error) {
      console.error('Dismiss heat alert error:', error);
    }
  };

  const getHeatScoreColor = (score) => {
    if (score > 75) return colors.accent;
    if (score > 40) return colors.warning;
    return colors.textSecondary;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';

    if (typeof dateValue?.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }

    const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
  };

  const HeatCard = ({ item }) => (
    <View style={styles.heatCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cattleInfo}>
          <Text style={styles.cattleName}>{item.name}</Text>
          <Text style={styles.cattleTag}>{item.cattle_id}</Text>
          <Text style={styles.cattleBreed}>{item.breed}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'in_heat' ? colors.accent : colors.warning }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'in_heat' ? 'IN HEAT' : 'APPROACHING'}
          </Text>
        </View>
      </View>

      <View style={styles.heatScoreContainer}>
        <Text style={styles.heatScoreLabel}>Heat Score</Text>
        <Text style={[
          styles.heatScore,
          { color: getHeatScoreColor(item.heat_score) }
        ]}>
          {item.heat_score.toFixed(0)}
        </Text>
        <View style={styles.heatScoreBar}>
          <View 
            style={[
              styles.heatScoreFill,
              { 
                width: `${item.heat_score}%`,
                backgroundColor: getHeatScoreColor(item.heat_score)
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Days Since Last Heat:</Text>
          <Text style={styles.detailValue}>{item.days_since_last_heat}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Last Heat Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.last_heat_date)}</Text>
        </View>
        {item.optimal_ai_window && (
          <View style={styles.optimalBadge}>
            <Text style={styles.optimalText}>⭐ Optimal AI Window</Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.aiButton]}
          onPress={() => logAIEvent(item.cattle_id)}
        >
          <Text style={styles.aiButtonText}>Log AI Event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.dismissButton]}
          onPress={() => dismissHeatAlert(item.cattle_id)}
        >
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heat Detection</Text>

      {/* AI Event Modal */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log AI Event</Text>
            <Text style={styles.modalLabel}>Bull / Semen Reference:</Text>
            <TextInput
              style={styles.modalInput}
              value={bullReference}
              onChangeText={setBullReference}
              placeholder="e.g. BULL-001"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setAiModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={submitAIEvent}
              >
                <Text style={styles.modalButtonTextConfirm}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={heatData}
        renderItem={({ item }) => <HeatCard item={item} />}
        keyExtractor={(item) => item.cattle_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadHeatDetection} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cattle in heat detected</Text>
            <Text style={styles.emptySubtext}>
              Check back later for heat detection updates
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Alert.alert('Coming Soon', 'Manual AI event logging will be available soon.');
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginVertical: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  heatCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cattleInfo: {
    flex: 1,
  },
  cattleName: {
    ...typography.h2,
    marginBottom: 4,
  },
  cattleTag: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cattleBreed: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    ...typography.badge,
    color: colors.surface,
    fontWeight: 'bold',
  },
  heatScoreContainer: {
    marginBottom: 16,
  },
  heatScoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  heatScore: {
    ...typography.metric,
    marginBottom: 8,
  },
  heatScoreBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heatScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
  },
  optimalBadge: {
    backgroundColor: colors.accent + '20',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  optimalText: {
    ...typography.badge,
    color: colors.accent,
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: colors.primary,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  aiButtonText: {
    ...typography.badge,
    color: colors.surface,
    fontWeight: 'bold',
  },
  dismissButtonText: {
    ...typography.badge,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  modalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
});

export default HeatDetectionScreen;
