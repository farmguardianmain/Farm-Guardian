import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCattleStore } from '../../store';
import { colors, typography, statusColors } from '../../theme';

const CattleDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { tagId } = route.params;
  const { selectedCattle, fetchCattleDetail, isLoading } = useCattleStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tagId) {
      fetchCattleDetail(tagId);
    }
  }, [tagId]);

  useEffect(() => {
    if (selectedCattle?.cattle) {
      navigation.setOptions({
        title: selectedCattle.cattle.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('EditCattle', { tagId })}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [selectedCattle, navigation]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'health', label: 'Health Log' },
    { key: 'milk', label: 'Milk Records' },
    { key: 'reproduction', label: 'Reproduction' },
  ];

  const getStatusColor = (status) => {
    return statusColors[status] || colors.textSecondary;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const calculateAge = (dateOfBirth) => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} years ${months} months`;
    }
    return `${months} months`;
  };

  const renderOverviewTab = () => {
    const cattle = selectedCattle?.cattle;
    const reading = selectedCattle?.latest_reading;

    return (
      <View style={styles.tabContent}>
        {/* Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tag ID</Text>
              <Text style={styles.infoValue}>{cattle?.tag_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Breed</Text>
              <Text style={styles.infoValue}>{cattle?.breed}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{cattle?.weight}kg</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{calculateAge(cattle?.date_of_birth)}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(cattle?.status) }
            ]}>
              <Text style={styles.statusText}>{cattle?.status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Live Readings */}
        {reading && (
          <View style={styles.readingsSection}>
            <Text style={styles.sectionTitle}>Live Sensor Readings</Text>
            <View style={styles.readingsGrid}>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Temperature</Text>
                <Text style={[
                  styles.readingValue,
                  { color: reading.body_temperature > 39.5 ? colors.critical : 
                           reading.body_temperature < 37.5 ? colors.warning : colors.healthy }
                ]}>
                  {reading.body_temperature?.toFixed(1)}°C
                </Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Activity</Text>
                <Text style={styles.readingValue}>{reading.activity_level}</Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Rumination (24h)</Text>
                <Text style={[
                  styles.readingValue,
                  { color: reading.rumination_hours_24h < 5 ? colors.warning : colors.healthy }
                ]}>
                  {reading.rumination_hours_24h?.toFixed(1)}h
                </Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Eating (24h)</Text>
                <Text style={styles.readingValue}>{reading.eating_hours_24h?.toFixed(1)}h</Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Milk Yield</Text>
                <Text style={styles.readingValue}>{reading.milk_yield_liters?.toFixed(1)}L</Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Heat Score</Text>
                <Text style={[
                  styles.readingValue,
                  { color: reading.heat_score > 75 ? colors.accent : colors.healthy }
                ]}>
                  {reading.heat_score?.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHealthLogTab = () => {
    const healthEvents = selectedCattle?.health_events || [];

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Navigate to add health event screen
            Alert.alert('Coming Soon', 'Add health event functionality will be available soon.');
          }}
        >
          <Text style={styles.addButtonText}>+ Add Health Event</Text>
        </TouchableOpacity>

        {healthEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No health events recorded</Text>
          </View>
        ) : (
          healthEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>{event.event_type?.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.eventDate}>{formatDateTime(event.date)}</Text>
              </View>
              <Text style={styles.eventNotes}>{event.notes}</Text>
              <Text style={styles.eventTreatedBy}>Treated by: {event.treated_by}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderMilkRecordsTab = () => {
    const milkRecords = selectedCattle?.milk_records || [];

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // Navigate to log milk screen
            Alert.alert('Coming Soon', 'Log milk session functionality will be available soon.');
          }}
        >
          <Text style={styles.addButtonText}>+ Log Milk Session</Text>
        </TouchableOpacity>

        {milkRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No milk records found</Text>
          </View>
        ) : (
          milkRecords.map(record => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordSession}>{record.session?.toUpperCase()}</Text>
                <Text style={styles.recordYield}>{record.yield_liters}L</Text>
              </View>
              <Text style={styles.recordDate}>{formatDateTime(record.date)}</Text>
              {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderReproductionTab = () => {
    const reproEvents = selectedCattle?.reproduction_events || [];

    return (
      <View style={styles.tabContent}>
        {reproEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reproduction events recorded</Text>
          </View>
        ) : (
          reproEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventType}>AI Event</Text>
                <Text style={styles.eventDate}>{formatDateTime(event.date)}</Text>
              </View>
              <Text style={styles.eventNotes}>Bull/Semen: {event.bull_semen_reference}</Text>
              {event.notes && <Text style={styles.eventNotes}>{event.notes}</Text>}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'health':
        return renderHealthLogTab();
      case 'milk':
        return renderMilkRecordsTab();
      case 'reproduction':
        return renderReproductionTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => fetchCattleDetail(tagId)} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    ...typography.badge,
    color: colors.surface,
  },
  readingsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  readingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  readingItem: {
    width: '50%',
    marginBottom: 16,
  },
  readingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  readingValue: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 18,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    ...typography.badge,
    color: colors.primary,
    fontWeight: 'bold',
  },
  eventDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  eventNotes: {
    ...typography.body,
    marginBottom: 4,
  },
  eventTreatedBy: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordSession: {
    ...typography.badge,
    color: colors.primary,
    fontWeight: 'bold',
  },
  recordYield: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.secondary,
  },
  recordDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recordNotes: {
    ...typography.body,
    color: colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginRight: 16,
  },
  editButtonText: {
    ...typography.badge,
    color: colors.surface,
  },
});

export default CattleDetailScreen;
