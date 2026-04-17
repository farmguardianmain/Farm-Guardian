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
import ApiService from '../../services/api';
import { colors, typography } from '../../theme';

const MilkSummaryScreen = () => {
  const navigation = useNavigation();
  const [summaryData, setSummaryData] = useState({
    today_total: 0,
    seven_day_chart: [],
    top_producers: [],
    bottom_producers: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMilkSummary();
  }, []);

  const loadMilkSummary = async () => {
    setIsLoading(true);
    try {
      const milkData = await ApiService.getMilkSummary();

      setSummaryData(milkData);
    } catch (error) {
      console.error('Load milk summary error:', error);
      Alert.alert('Error', 'Failed to load milk summary');
    } finally {
      setIsLoading(false);
    }
  };

  const ProducerCard = ({ producer, isTop = true }) => (
    <View style={styles.producerCard}>
      <View style={styles.producerInfo}>
        <Text style={styles.producerName}>{producer.name}</Text>
        <Text style={styles.producerTag}>{producer.cattle_id}</Text>
      </View>
      <Text style={[
        styles.producerYield,
        { color: isTop ? colors.secondary : colors.warning }
      ]}>
        {producer.yield}L
      </Text>
    </View>
  );

  const ChartBar = ({ day, index, maxValue }) => {
    const percentage = maxValue > 0 ? (day.yield / maxValue) * 100 : 0;
    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
    
    return (
      <View style={styles.chartBarContainer}>
        <Text style={styles.chartBarLabel}>
          {new Date(day.date).getDate()}
        </Text>
        <View style={styles.chartBarBackground}>
          <View 
            style={[
              styles.chartBar,
              { height: `${percentage}%` },
              isToday && styles.chartBarToday
            ]} 
          />
        </View>
        <Text style={styles.chartBarValue}>
          {day.yield.toFixed(0)}
        </Text>
      </View>
    );
  };

  const maxValue = Math.max(...summaryData.seven_day_chart.map(day => day.yield), 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadMilkSummary} />
      }
    >
      <Text style={styles.title}>Milk Production</Text>

      {/* Today's Total */}
      <View style={styles.todayContainer}>
        <Text style={styles.todayLabel}>Today's Total Yield</Text>
        <Text style={styles.todayValue}>{summaryData.today_total.toFixed(1)}L</Text>
        <Text style={styles.todaySubtext}>Liters from all cattle</Text>
      </View>

      {/* 7-Day Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>7-Day Production Trend</Text>
        <View style={styles.chart}>
          {summaryData.seven_day_chart.map((day, index) => (
            <ChartBar 
              key={day.date} 
              day={day} 
              index={index} 
              maxValue={maxValue}
            />
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Daily Yield</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>

      {/* Top Producers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 3 Producers Today</Text>
        {summaryData.top_producers.map((producer, index) => (
          <ProducerCard key={producer.cattle_id} producer={producer} isTop={true} />
        ))}
      </View>

      {/* Bottom Producers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bottom 3 Producers Today</Text>
        {summaryData.bottom_producers.map((producer, index) => (
          <ProducerCard key={producer.cattle_id} producer={producer} isTop={false} />
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('LogMilk')}
      >
        <Text style={styles.actionButtonText}>+ Log Milk Session</Text>
      </TouchableOpacity>
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
  todayContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  todayValue: {
    ...typography.metric,
    color: colors.secondary,
    marginBottom: 4,
  },
  todaySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chartBarBackground: {
    width: 20,
    height: 80,
    backgroundColor: colors.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 20,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarToday: {
    backgroundColor: colors.accent,
  },
  chartBarValue: {
    ...typography.caption,
    color: colors.text,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  producerCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  producerInfo: {
    flex: 1,
  },
  producerName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  producerTag: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  producerYield: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MilkSummaryScreen;
