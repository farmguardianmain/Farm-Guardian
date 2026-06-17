import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography } from '../theme';

/**
 * CattleSelectModal
 *
 * Props:
 *  - visible      {boolean}            Whether the modal is shown
 *  - cattle       {Array}              List of cattle objects from store: { tag_id, name, breed, status }
 *  - onSelect     {(tag_id) => void}   Called when user picks a cow
 *  - onClose      {() => void}         Called when user cancels
 *  - title        {string}             Optional modal title (default: "Select Cattle")
 */
const CattleSelectModal = ({ visible, cattle = [], onSelect, onClose, title = 'Select Cattle' }) => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? cattle.filter(
        c =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.tag_id.toLowerCase().includes(query.toLowerCase()),
      )
    : cattle;

  const handleSelect = (tagId) => {
    setQuery('');
    onSelect(tagId);
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const statusColor = (status) => {
    const map = {
      healthy: colors.secondary,
      overweight: '#FF5252',
      underweight: '#FFB74D',
      alert: colors.accent,
      in_heat: colors.accent,
      pregnant: colors.primary,
      dry: colors.textSecondary,
    };
    return map[status] || colors.textSecondary;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or tag..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.tag_id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No cattle found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item.tag_id)}
                activeOpacity={0.75}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemTag}>{item.tag_id} · {item.breed}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemTag: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.background,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default CattleSelectModal;
