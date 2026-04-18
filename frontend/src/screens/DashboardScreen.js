import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import { colors, typography } from '../theme';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [summaryData, setSummaryData] = useState({
    totalCattle: 0,
    cattleInHeat: 0,
    activeAlerts: 0,
    todayMilkYield: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [activityData, setActivityData] = useState({
    active: 0,
    resting: 0,
    eating: 0,
    ruminating: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();

    const refreshTimer = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load summary data
      await Promise.all([
        loadSummaryData(),
        loadActivityData(),
        loadAlertsData(),
      ]);
    } catch (error) {
      console.error('Dashboard data load error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      const [
        cattleResult,
        alertStatsResult,
        milkSummaryResult,
        heatDataResult,
      ] = await Promise.allSettled([
        ApiService.getCattle(),
        ApiService.getAlertStats(),
        ApiService.getMilkSummary(),
        ApiService.getHeatDetection(),
      ]);

      const cattle = cattleResult.status === 'fulfilled' ? cattleResult.value : [];
      const alertStats = alertStatsResult.status === 'fulfilled'
        ? alertStatsResult.value
        : { active_alerts: 0 };
      const milkSummary = milkSummaryResult.status === 'fulfilled'
        ? milkSummaryResult.value
        : { today_total: 0 };
      const heatData = heatDataResult.status === 'fulfilled' ? heatDataResult.value : [];

      setSummaryData({
        totalCattle: cattle.length,
        cattleInHeat: heatData.filter(h => h.status === 'in_heat').length,
        activeAlerts: alertStats.active_alerts,
        todayMilkYield: milkSummary.today_total || 0,
      });
    } catch (error) {
      console.error('Summary data error:', error);
    }
  };

  const loadAlertsData = async () => {
    try {
      const activeAlerts = await ApiService.getAlerts('active');
      setAlerts(activeAlerts.slice(0, 10));
    } catch (error) {
      console.error('Alerts data error:', error);
      setAlerts([]);
    }
  };

  const loadActivityData = async () => {
    try {
      const cattle = await ApiService.getCattle();
      const activities = { active: 0, resting: 0, eating: 0, ruminating: 0 };

      const defaultPattern = ['active', 'eating', 'resting', 'ruminating'];
      cattle.forEach((_, index) => {
        const activity = defaultPattern[index % defaultPattern.length];
        activities[activity]++;
      });

      setActivityData(activities);
    } catch (error) {
      console.error('Activity data error:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await ApiService.dismissAlert(alertId);
      await loadDashboardData();
    } catch (error) {
      console.error('Dismiss alert error:', error);
      Alert.alert('Error', 'Failed to dismiss alert');
    }
  };

  const formatAlertTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (typeof timestamp?.toDate === 'function') {
      return timestamp.toDate().toLocaleTimeString();
    }
    if (typeof timestamp?.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleTimeString();
    }

    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleTimeString();
  };

  const SummaryCard = ({ title, value, subtitle, onPress, color = colors.primary }) => (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const AlertCard = ({ alert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertCattle}>{alert.cattle_id}</Text>
        <View style={[
          styles.severityBadge,
          { backgroundColor: alert.severity === 'critical' ? colors.critical : 
                           alert.severity === 'warning' ? colors.warning : colors.textSecondary }
        ]}>
          <Text style={styles.severityText}>{alert.severity}</Text>
        </View>
      </View>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={styles.alertDescription}>{alert.description}</Text>
      <View style={styles.alertFooter}>
        <Text style={styles.alertTime}>
          {formatAlertTime(alert.timestamp)}
        </Text>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => dismissAlert(alert.id)}
        >
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ActivitySegment = ({ label, value, color, percentage }) => (
    <View style={styles.activitySegment}>
      <View style={[styles.activityDot, { backgroundColor: color }]} />
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activityPercentage}>({percentage}%)</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadDashboardData} />
      }
    >
      <Text style={styles.title}>Farm Dashboard</Text>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Total Cattle"
          value={summaryData.totalCattle}
          onPress={() => navigation.navigate('CattleStack')}
        />
        <SummaryCard
          title="In Heat Today"
          value={summaryData.cattleInHeat}
          subtitle="cattle"
          onPress={() => navigation.navigate('Repro')}
          color={colors.accent}
        />
        <SummaryCard
          title="Active Alerts"
          value={summaryData.activeAlerts}
          subtitle="alerts"
          onPress={() => navigation.navigate('Alerts')}
          color={colors.critical}
        />
        <SummaryCard
          title="Today's Milk"
          value={`${summaryData.todayMilkYield.toFixed(1)}L`}
          onPress={() => navigation.navigate('Milk')}
          color={colors.secondary}
        />
      </View>

      {/* Herd Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Herd Activity</Text>
        <View style={styles.activityContainer}>
          {Object.entries(activityData).map(([activity, count]) => {
            const total = Object.values(activityData).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const activityColors = {
              active: colors.active,
              resting: colors.resting,
              eating: colors.eating,
              ruminating: colors.ruminating,
            };

            return (
              <ActivitySegment
                key={activity}
                label={activity.charAt(0).toUpperCase() + activity.slice(1)}
                value={count}
                color={activityColors[activity]}
                percentage={percentage}
              />
            );
          })}
        </View>
      </View>

      {/* Active Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Alerts</Text>
        {alerts.length === 0 ? (
          <Text style={styles.noAlertsText}>No active alerts</Text>
        ) : (
          alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </View>
    </ScrollView>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    ...typography.metric,
    textAlign: 'center',
  },
  summarySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  activityContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activitySegment: {
    alignItems: 'center',
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  activityLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  activityValue: {
    ...typography.body,
    fontWeight: 'bold',
  },
  activityPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  alertCattle: {
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
  alertTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
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
  noAlertsText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: 20,
  },
});

export default DashboardScreen;
