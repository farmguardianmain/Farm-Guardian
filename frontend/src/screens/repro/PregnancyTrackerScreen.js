import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/api';
import { colors, typography } from '../../theme';

const PregnancyTrackerScreen = () => {
  const navigation = useNavigation();
  const [pregnancyData, setPregnancyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPregnancyData();
  }, []);

  const loadPregnancyData = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getPregnancyTracker();

      setPregnancyData(data);
    } catch (error) {
      console.error('Load pregnancy data error:', error);
      Alert.alert('Error', 'Failed to load pregnancy data');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCalving = async (cattleId, cattleName) => {
    Alert.alert(
      'Confirm Calving',
      `Confirm that ${cattleName} has calved? This will reset the reproductive cycle.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const calvingData = {
                cattle_id: cattleId,
                calving_date: new Date().toISOString(),
                notes: '',
              };

              await ApiService.confirmCalving(calvingData);
              Alert.alert(
                'Success',
                'Calving confirmed successfully',
                [{ text: 'OK', onPress: () => loadPregnancyData() }]
              );
            } catch (error) {
              console.error('Confirm calving error:', error);
              Alert.alert('Error', 'Failed to confirm calving');
            }
          },
        },
      ]
    );
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'early': return colors.secondary;
      case 'mid': return colors.primary;
      case 'late': return colors.warning;
      case 'overdue': return colors.critical;
      default: return colors.textSecondary;
    }
  };

  const getStageLabel = (stage) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';

    if (typeof dateValue?.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }

    const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
  };

  const PregnancyCard = ({ item }) => (
    <View style={styles.pregnancyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cattleInfo}>
          <Text style={styles.cattleName}>{item.name}</Text>
          <Text style={styles.cattleTag}>{item.cattle_id}</Text>
          <Text style={styles.cattleBreed}>{item.breed}</Text>
        </View>
        <View style={[
          styles.stageBadge,
          { backgroundColor: getStageColor(item.stage) }
        ]}>
          <Text style={styles.stageText}>
            {getStageLabel(item.stage)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Pregnancy Progress</Text>
          <Text style={styles.daysCount}>{item.days_pregnant} days</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(item.days_pregnant / 285) * 100}%`,
                backgroundColor: getStageColor(item.stage)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Day {item.days_pregnant} of 285
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Conception Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.conception_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expected Calving:</Text>
          <Text style={styles.detailValue}>{formatDate(item.expected_calving_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bull/Semen Reference:</Text>
          <Text style={styles.detailValue}>{item.bull_semen_reference}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Days Until Calving:</Text>
          <Text style={[
            styles.detailValue,
            { color: item.days_pregnant >= 270 ? colors.critical : colors.text }
          ]}>
            {285 - item.days_pregnant} days
          </Text>
        </View>
      </View>

      {item.days_pregnant >= 270 && (
        <View style={styles.alertContainer}>
          <Text style={styles.alertText}>🚨 Calving Imminent!</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => confirmCalving(item.cattle_id, item.name)}
      >
        <Text style={styles.confirmButtonText}>Confirm Calving</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pregnancy Tracker</Text>

      <FlatList
        data={pregnancyData}
        renderItem={({ item }) => <PregnancyCard item={item} />}
        keyExtractor={(item) => item.cattle_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadPregnancyData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pregnant cattle</Text>
            <Text style={styles.emptySubtext}>
              Pregnancy data will appear here after AI events are logged
            </Text>
          </View>
        }
      />
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
  },
  pregnancyCard: {
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
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stageText: {
    ...typography.badge,
    color: colors.surface,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  daysCount: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  alertContainer: {
    backgroundColor: colors.critical + '20',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  alertText: {
    ...typography.badge,
    color: colors.critical,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
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
    lineHeight: 20,
  },
});

export default PregnancyTrackerScreen;
