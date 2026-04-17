import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCattleStore } from '../../store';
import { colors, typography, statusColors } from '../../theme';

const CattleListScreen = () => {
  const navigation = useNavigation();
  const { cattle, isLoading, fetchCattle } = useCattleStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredCattle, setFilteredCattle] = useState([]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'healthy', label: 'Healthy' },
    { key: 'alert', label: 'Alert' },
    { key: 'in_heat', label: 'In Heat' },
    { key: 'pregnant', label: 'Pregnant' },
    { key: 'dry', label: 'Dry' },
  ];

  useEffect(() => {
    loadCattle();
  }, []);

  useEffect(() => {
    filterCattle();
  }, [cattle, searchQuery, selectedFilter]);

  const loadCattle = async () => {
    await fetchCattle();
  };

  const filterCattle = () => {
    let filtered = [...cattle];

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(cow => cow.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(cow =>
        cow.tag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCattle(filtered);
  };

  const getStatusColor = (status) => {
    return statusColors[status] || colors.textSecondary;
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const CattleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.cattleCard}
      onPress={() => navigation.navigate('CattleDetail', { tagId: item.tag_id })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cattleName}>{item.name}</Text>
          <Text style={styles.cattleTag}>{item.tag_id}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Breed:</Text>
          <Text style={styles.detailValue}>{item.breed}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{item.weight}kg</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Age:</Text>
          <Text style={styles.detailValue}>
            {calculateAge(item.date_of_birth)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const calculateAge = (dateOfBirth) => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const FilterPill = ({ filter }) => (
    <TouchableOpacity
      style={[
        styles.filterPill,
        selectedFilter === filter.key && styles.filterPillActive
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={[
        styles.filterPillText,
        selectedFilter === filter.key && styles.filterPillTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by tag or name..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {filters.map(filter => (
          <FilterPill key={filter.key} filter={filter} />
        ))}
      </View>

      {/* Cattle List */}
      <FlatList
        data={filteredCattle}
        renderItem={({ item }) => <CattleCard item={item} />}
        keyExtractor={(item) => item.tag_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCattle} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cattle found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first cattle to get started'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCattle')}
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filterPill: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.badge,
    color: colors.text,
  },
  filterPillTextActive: {
    color: colors.surface,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  cattleCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cattleName: {
    ...typography.h2,
    marginBottom: 4,
  },
  cattleTag: {
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
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
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
});

export default CattleListScreen;
