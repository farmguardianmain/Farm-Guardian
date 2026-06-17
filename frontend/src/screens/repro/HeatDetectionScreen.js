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
import { useCattleStore } from '../../store';
import { colors, typography } from '../../theme';
import CattleSelectModal from '../../components/CattleSelectModal';

const HeatDetectionScreen = () => {
  const navigation = useNavigation();
  const [heatData, setHeatData] = useState([]);
  const [manualEvents, setManualEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // AI Event modal state (log AI for an existing heat card)
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiModalCattleId, setAiModalCattleId] = useState(null);
  const [bullReference, setBullReference] = useState('');
  const [aiNotes, setAiNotes] = useState('');

  // Manual heat event modal state (FAB)
  const [heatModalVisible, setHeatModalVisible] = useState(false);
  const [heatCattleId, setHeatCattleId] = useState(null);
  const [heatCattleName, setHeatCattleName] = useState('');
  const [heatScore, setHeatScore] = useState('');
  const [heatNotes, setHeatNotes] = useState('');
  const [heatCattlePickerVisible, setHeatCattlePickerVisible] = useState(false);

  // Cattle picker for AI modal
  const [aiCattlePickerVisible, setAiCattlePickerVisible] = useState(false);

  const { cattle, fetchCattle } = useCattleStore();

  useEffect(() => {
    loadHeatDetection();
    if (cattle.length === 0) {
      fetchCattle();
    }
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

  // Merge synthetic heat list + manual events (deduplicated by cattle_id, prefer synthetic)
  const mergedHeatList = () => {
    const syntheticIds = new Set(heatData.map(h => h.cattle_id));
    const manualOnly = manualEvents.filter(m => !syntheticIds.has(m.cattle_id));
    return [...heatData, ...manualOnly].sort((a, b) => b.heat_score - a.heat_score);
  };

  /* ── AI Event (from existing card) ── */
  const openAiModal = (cattleId) => {
    setAiModalCattleId(cattleId);
    setBullReference('');
    setAiNotes('');
    setAiModalVisible(true);
  };

  const submitAIEvent = async () => {
    if (!aiModalCattleId) {
      Alert.alert('Error', 'Please select a cattle');
      return;
    }
    if (!bullReference.trim()) {
      Alert.alert('Error', 'Bull/Semen reference is required');
      return;
    }
    setAiModalVisible(false);
    try {
      await ApiService.logAIEvent({
        cattle_id: aiModalCattleId,
        bull_semen_reference: bullReference.trim(),
        date: new Date().toISOString(),
        notes: aiNotes.trim(),
      });
      Alert.alert('Success', 'AI event logged successfully', [
        { text: 'OK', onPress: loadHeatDetection },
      ]);
    } catch (error) {
      console.error('Log AI event error:', error);
      Alert.alert('Error', 'Failed to log AI event');
    }
  };

  /* ── Manual Heat Event (FAB) ── */
  const openHeatModal = () => {
    setHeatCattleId(null);
    setHeatCattleName('');
    setHeatScore('');
    setHeatNotes('');
    setHeatModalVisible(true);
  };

  const submitHeatEvent = () => {
    if (!heatCattleId) {
      Alert.alert('Error', 'Please select a cattle');
      return;
    }
    const score = parseFloat(heatScore);
    if (isNaN(score) || score < 0 || score > 100) {
      Alert.alert('Error', 'Heat score must be a number between 0 and 100');
      return;
    }

    // Determine status
    const status = score > 75 ? 'in_heat' : score > 40 ? 'approaching' : null;
    if (!status) {
      Alert.alert(
        'Note',
        'Heat score is too low to indicate heat cycle (< 40). Event saved locally but not shown in list.',
      );
    }

    const foundCow = cattle.find(c => c.tag_id === heatCattleId);

    const newEvent = {
      cattle_id: heatCattleId,
      name: foundCow?.name || heatCattleId,
      breed: foundCow?.breed || '',
      heat_score: score,
      status: status || 'approaching',
      days_since_last_heat: 0,
      optimal_ai_window: score > 60,
      last_heat_date: new Date().toISOString(),
      notes: heatNotes.trim(),
      manual: true,
    };

    setManualEvents(prev => {
      const existing = prev.findIndex(m => m.cattle_id === heatCattleId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newEvent;
        return updated;
      }
      return [...prev, newEvent];
    });

    setHeatModalVisible(false);
    Alert.alert('Success', `Heat event recorded for ${foundCow?.name || heatCattleId}.\nHeat Score: ${score}/100`);
  };

  const dismissHeatAlert = (cattleId) => {
    Alert.alert('Dismiss Heat Alert', 'Mark this heat detection as handled?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        onPress: () => {
          setHeatData(prev => prev.filter(item => item.cattle_id !== cattleId));
          setManualEvents(prev => prev.filter(item => item.cattle_id !== cattleId));
        },
      },
    ]);
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

  /* ── Heat Card ── */
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
          { backgroundColor: item.status === 'in_heat' ? colors.accent : colors.warning },
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'in_heat' ? 'IN HEAT' : 'APPROACHING'}
          </Text>
        </View>
      </View>

      {/* Heat score bar */}
      <View style={styles.heatScoreContainer}>
        <Text style={styles.heatScoreLabel}>Heat Score</Text>
        <Text style={[styles.heatScore, { color: getHeatScoreColor(item.heat_score) }]}>
          {item.heat_score.toFixed(0)}/100
        </Text>
        <View style={styles.heatScoreBar}>
          <View
            style={[
              styles.heatScoreFill,
              {
                width: `${Math.min(100, item.heat_score)}%`,
                backgroundColor: getHeatScoreColor(item.heat_score),
              },
            ]}
          />
        </View>
      </View>

      {/* Heat metric legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
          <Text style={styles.legendText}>0–40 Not in heat</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>40–75 Approaching</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>75–100 In heat</Text>
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
        {item.manual && (
          <View style={styles.manualBadge}>
            <Text style={styles.manualBadgeText}>📝 Manually logged</Text>
          </View>
        )}
        {item.notes ? (
          <Text style={styles.notesText}>Note: {item.notes}</Text>
        ) : null}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.aiButton]}
          onPress={() => openAiModal(item.cattle_id)}
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

      {/* Metric guide banner */}
      <View style={styles.guideBanner}>
        <Text style={styles.guideText}>
          💡 Heat Score considers activity spikes, temperature rise, rumination drop &amp; estrus cycle position.
        </Text>
      </View>

      {/* ── Manual Heat Event Modal ── */}
      <Modal
        visible={heatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHeatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Heat Event</Text>

            {/* Cattle selector */}
            <Text style={styles.modalLabel}>Cattle *</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setHeatCattlePickerVisible(true)}
            >
              <Text style={heatCattleId ? styles.selectorText : styles.selectorPlaceholder}>
                {heatCattleId ? `${heatCattleName} (${heatCattleId})` : 'Tap to select cattle…'}
              </Text>
              <Text style={styles.selectorChevron}>▾</Text>
            </TouchableOpacity>

            {/* Heat Score */}
            <Text style={styles.modalLabel}>Heat Score (0–100) *</Text>
            <TextInput
              style={styles.modalInput}
              value={heatScore}
              onChangeText={setHeatScore}
              placeholder="e.g. 82"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />

            {/* Score guide */}
            <View style={styles.scoreGuideRow}>
              <Text style={[styles.scoreGuide, { color: colors.textSecondary }]}>0–40 None</Text>
              <Text style={[styles.scoreGuide, { color: colors.warning }]}>40–75 Approaching</Text>
              <Text style={[styles.scoreGuide, { color: colors.accent }]}>75–100 In Heat</Text>
            </View>

            {/* Notes */}
            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={heatNotes}
              onChangeText={setHeatNotes}
              placeholder="e.g. observed mounting behaviour"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setHeatModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={submitHeatEvent}
              >
                <Text style={styles.modalButtonTextConfirm}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cattle picker for heat modal */}
      <CattleSelectModal
        visible={heatCattlePickerVisible}
        cattle={cattle}
        onSelect={(tagId) => {
          const found = cattle.find(c => c.tag_id === tagId);
          setHeatCattleId(tagId);
          setHeatCattleName(found?.name || tagId);
          setHeatCattlePickerVisible(false);
        }}
        onClose={() => setHeatCattlePickerVisible(false)}
      />

      {/* ── AI Event Modal ── */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log AI Event</Text>

            {aiModalCattleId ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.modalLabel}>Cattle</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                  {cattle.find(c => c.tag_id === aiModalCattleId)?.name || aiModalCattleId} ({aiModalCattleId})
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.modalLabel}>Select Cattle *</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setAiCattlePickerVisible(true)}
                >
                  <Text style={aiModalCattleId ? styles.selectorText : styles.selectorPlaceholder}>
                    {aiModalCattleId
                      ? `${cattle.find(c => c.tag_id === aiModalCattleId)?.name || aiModalCattleId} (${aiModalCattleId})`
                      : 'Tap to select cattle…'}
                  </Text>
                  <Text style={styles.selectorChevron}>▾</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.modalLabel}>Bull / Semen Reference *</Text>
            <TextInput
              style={styles.modalInput}
              value={bullReference}
              onChangeText={setBullReference}
              placeholder="e.g. BULL-001"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={aiNotes}
              onChangeText={setAiNotes}
              placeholder="e.g. first insemination attempt"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
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

      {/* Cattle picker for AI modal */}
      <CattleSelectModal
        visible={aiCattlePickerVisible}
        cattle={cattle}
        onSelect={(tagId) => {
          setAiModalCattleId(tagId);
          setAiCattlePickerVisible(false);
        }}
        onClose={() => setAiCattlePickerVisible(false)}
      />

      {/* Main list */}
      <FlatList
        data={mergedHeatList()}
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
              Tap + to manually log a heat event, or pull down to refresh sensor data.
            </Text>
          </View>
        }
      />

      {/* FAB – opens manual heat entry modal */}
      <TouchableOpacity style={styles.fab} onPress={openHeatModal}>
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
    marginTop: 20,
    marginBottom: 8,
  },
  guideBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.primary + '18',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  guideText: {
    ...typography.caption,
    color: colors.primary,
    lineHeight: 18,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  heatCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cattleInfo: { flex: 1 },
  cattleName: { ...typography.h2, marginBottom: 4 },
  cattleTag: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  cattleBreed: { ...typography.caption, color: colors.textSecondary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { ...typography.badge, color: colors.surface, fontWeight: 'bold' },
  heatScoreContainer: { marginBottom: 12 },
  heatScoreLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
  heatScore: { ...typography.metric, marginBottom: 8, fontSize: 28 },
  heatScoreBar: {
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    overflow: 'hidden',
  },
  heatScoreFill: { height: '100%', borderRadius: 5 },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  detailsContainer: { marginBottom: 14 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: { ...typography.body, color: colors.textSecondary },
  detailValue: { ...typography.body, fontWeight: '600' },
  optimalBadge: {
    backgroundColor: colors.accent + '20',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  optimalText: { ...typography.badge, color: colors.accent, fontWeight: 'bold' },
  manualBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  manualBadgeText: { ...typography.badge, color: colors.primary },
  notesText: { ...typography.caption, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  actionContainer: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  aiButton: { backgroundColor: colors.primary },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  aiButtonText: { ...typography.badge, color: colors.surface, fontWeight: 'bold' },
  dismissButtonText: { ...typography.badge, color: colors.textSecondary },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { ...typography.h2, textAlign: 'center', marginBottom: 10 },
  emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  fabText: { fontSize: 26, fontWeight: 'bold', color: colors.surface },
  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: { ...typography.h2, marginBottom: 16 },
  modalLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  textArea: { height: 80 },
  selectorButton: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.background,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: { ...typography.body, color: colors.text, flex: 1 },
  selectorPlaceholder: { ...typography.body, color: colors.textSecondary, flex: 1 },
  selectorChevron: { fontSize: 18, color: colors.primary, marginLeft: 8 },
  scoreGuideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
    marginBottom: 16,
  },
  scoreGuide: { ...typography.caption, fontSize: 11 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  modalButtonConfirm: { backgroundColor: colors.primary },
  modalButtonTextCancel: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  modalButtonTextConfirm: { ...typography.body, color: colors.surface, fontWeight: '600' },
});

export default HeatDetectionScreen;
