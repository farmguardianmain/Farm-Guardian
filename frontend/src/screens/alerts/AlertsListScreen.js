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
import ApiService from '../../services/api';
import { colors, typography, statusColors } from '../../theme';

const AlertsListScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ];

  useEffect(() => {
    loadAlerts();

    const refreshTimer = setInterval(() => {
      loadAlerts();
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, [selectedTab]);

  const parseTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
    if (typeof timestamp?.seconds === 'number') return new Date(timestamp.seconds * 1000);
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const alertsData = await ApiService.getAlerts(selectedTab);

      // Sort by severity and timestamp
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      alertsData.sort((a, b) => {
        if (a.dismissed !== b.dismissed) {
          return a.dismissed ? 1 : -1;
        }
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        const bTime = parseTimestamp(b.timestamp)?.getTime() || 0;
        const aTime = parseTimestamp(a.timestamp)?.getTime() || 0;
        return bTime - aTime;
      });

      setAlerts(alertsData);
    } catch (error) {
      console.error('Load alerts error:', error);
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await ApiService.dismissAlert(alertId);
      await loadAlerts();
    } catch (error) {
      console.error('Dismiss alert error:', error);
      Alert.alert('Error', 'Failed to dismiss alert');
    }
  };

  const getSeverityColor = (severity) => {
    return statusColors[severity] || colors.textSecondary;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = parseTimestamp(timestamp);
    if (!date) return 'Unknown';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const AlertCard = ({ alert }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => {
        // AlertDetail screen not yet implemented - show details inline via alert
        Alert.alert(
          alert.title || 'Alert',
          alert.description || 'No description',
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <Text style={styles.alertCattle}>{alert.cattle_id}</Text>
          <Text style={styles.alertTitle}>{alert.title}</Text>
        </View>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(alert.severity) }
        ]}>
          <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.alertDescription}>{alert.description}</Text>
      
      <View style={styles.alertFooter}>
        <Text style={styles.alertTime}>{formatDateTime(alert.timestamp)}</Text>
        {!alert.dismissed && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissAlert(alert.id)}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
        {alert.dismissed && (
          <Text style={styles.resolvedText}>Resolved</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const TabButton = ({ tab }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab.key && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab.key)}
    >
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab.key && styles.tabButtonTextActive
      ]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TabButton key={tab.key} tab={tab} />
        ))}
      </View>

      {/* Alerts List */}
      <FlatList
        data={alerts}
        renderItem={({ item }) => <AlertCard alert={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadAlerts} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {selectedTab} alerts</Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'active' 
                ? 'Great job! No active alerts to handle.' 
                : selectedTab === 'resolved'
                ? 'No resolved alerts yet.'
                : 'No alerts found in the system.'}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertCattle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  alertTitle: {
    ...typography.body,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    ...typography.badge,
    color: colors.surface,
  },
  alertDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  dismissButtonText: {
    ...typography.badge,
    color: colors.surface,
  },
  resolvedText: {
    ...typography.badge,
    color: colors.healthy,
    fontWeight: 'bold',
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

export default AlertsListScreen;
