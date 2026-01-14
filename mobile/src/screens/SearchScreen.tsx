import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, StatusBar, Modal, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { searchRooms, createRoom, deleteRoom, type Room } from '../services/api';
import { supabase } from '../lib/supabase';

type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Search: undefined;
  Room: { room: Room };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [popularRooms, setPopularRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [lastSeenTimes, setLastSeenTimes] = useState<Record<string, string>>({});
  const [lastSeenCounts, setLastSeenCounts] = useState<Record<string, number>>({});
  const [showRoomActionSheet, setShowRoomActionSheet] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    loadPopularRooms();
    loadLastSeenTimes();

    // Auto-refresh room list every 5 seconds to show new message counts
    const interval = setInterval(() => {
      loadPopularRooms();
      if (query.trim()) {
        handleSearch();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [query]);

  async function loadLastSeenTimes() {
    try {
      const stored = await AsyncStorage.getItem('lastSeenTimes');
      if (stored) {
        setLastSeenTimes(JSON.parse(stored));
      }
      const storedCounts = await AsyncStorage.getItem('lastSeenCounts');
      if (storedCounts) {
        setLastSeenCounts(JSON.parse(storedCounts));
      }
    } catch (error) {
      console.error('Failed to load last seen times:', error);
    }
  }

  async function loadPopularRooms() {
    try {
      const { popularRooms } = await searchRooms('', 5);
      setPopularRooms(popularRooms);
    } catch (error) {
      console.error('Failed to load popular rooms:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadPopularRooms();
    if (query.trim()) {
      await handleSearch();
    }
    setRefreshing(false);
  }

  async function handleSearch() {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { results } = await searchRooms(query);
      setRooms(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    if (!newRoomTitle.trim()) {
      Alert.alert('Error', 'Please enter a room title');
      return;
    }

    setCreating(true);
    try {
      const room = await createRoom(newRoomTitle, newRoomDescription, newRoomCategory || 'general');
      setShowCreateModal(false);
      setNewRoomTitle('');
      setNewRoomDescription('');
      setNewRoomCategory('');
      
      // Refresh the room list to show the new room
      await loadPopularRooms();
      
      Alert.alert('Success', 'Room created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Room', { room }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  }

  function hasNewMessages(room: Room): boolean {
    const lastSeen = lastSeenTimes[room.id];
    if (!lastSeen) return room.message_count > 0;
    return new Date(room.last_activity) > new Date(lastSeen);
  }

  function getNewMessageCount(room: Room): number {
    const lastCount = lastSeenCounts[room.id];
    if (lastCount === undefined) return room.message_count;
    const newCount = room.message_count - lastCount;
    return newCount > 0 ? newCount : 0;
  }

  async function handleRoomPress(room: Room) {
    // Update last seen time and message count
    const now = new Date().toISOString();
    const updatedTimes = { ...lastSeenTimes, [room.id]: now };
    const updatedCounts = { ...lastSeenCounts, [room.id]: room.message_count };
    setLastSeenTimes(updatedTimes);
    setLastSeenCounts(updatedCounts);
    try {
      await AsyncStorage.setItem('lastSeenTimes', JSON.stringify(updatedTimes));
      await AsyncStorage.setItem('lastSeenCounts', JSON.stringify(updatedCounts));
    } catch (error) {
      console.error('Failed to save last seen time:', error);
    }
    navigation.navigate('Room', { room });
  }

  async function handleDeleteRoom(roomId: string) {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoom(roomId);
              await loadPopularRooms();
              if (query.trim()) {
                await handleSearch();
              }
              Alert.alert('Success', 'Room deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete room');
            }
          },
        },
      ]
    );
  }

  async function handleRoomLongPress(room: Room) {
    // Check if user is the creator
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roomData } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', room.id)
      .single();

    if (roomData?.created_by === user.id) {
      setSelectedRoom(room);
      setShowRoomActionSheet(true);
    }
  }

  function renderRoom({ item }: { item: Room }) {
    const hasNew = hasNewMessages(item);
    const newCount = getNewMessageCount(item);
    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => handleRoomPress(item)}
        onLongPress={() => handleRoomLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.roomIconContainer}>
          <Text style={styles.roomIcon}>💬</Text>
          {hasNew && newCount > 0 && (
            <View style={styles.newMessageBadge}>
              <Text style={styles.newMessageBadgeText}>{newCount > 99 ? '99+' : newCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.roomContent}>
          <View style={styles.roomTitleRow}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          {item.description && (
            <Text style={styles.roomDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.roomStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statText}>{item.member_count}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{item.message_count}</Text>
            </View>
          </View>
        </View>
        <View style={styles.roomArrow}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>SupportCircle</Text>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search support rooms..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>
      </View>

      {/* Room List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={rooms.length > 0 ? rooms : popularRooms}
          renderItem={renderRoom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {rooms.length > 0 ? 'Search Results' : 'Popular Rooms'}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Room Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Support Room</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Anxiety Support"
                placeholderTextColor="#64748b"
                value={newRoomTitle}
                onChangeText={setNewRoomTitle}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Brief description of the room"
                placeholderTextColor="#64748b"
                value={newRoomDescription}
                onChangeText={setNewRoomDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., mental health, recovery"
                placeholderTextColor="#64748b"
                value={newRoomCategory}
                onChangeText={setNewRoomCategory}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewRoomTitle('');
                  setNewRoomDescription('');
                  setNewRoomCategory('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, creating && styles.createButtonDisabled]}
                onPress={handleCreateRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Room Action Sheet */}
      <Modal
        visible={showRoomActionSheet}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoomActionSheet(false)}
      >
        <TouchableOpacity 
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowRoomActionSheet(false)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle} numberOfLines={2}>
                {selectedRoom?.title}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionSheetItem, styles.actionSheetItemDanger]}
              onPress={() => {
                setShowRoomActionSheet(false);
                if (selectedRoom) {
                  handleDeleteRoom(selectedRoom.id);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetIcon}>🗑️</Text>
              <Text style={[styles.actionSheetText, styles.actionSheetTextDanger]}>Delete Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={() => setShowRoomActionSheet(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  roomIcon: {
    fontSize: 24,
  },
  newMessageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  newMessageBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  roomContent: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  roomDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 18,
  },
  roomStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  roomArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#64748b',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#3b82f6',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  actionSheetHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionSheetItemDanger: {
    borderBottomWidth: 0,
  },
  actionSheetIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionSheetText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  actionSheetTextDanger: {
    color: '#ef4444',
  },
  actionSheetCancel: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  actionSheetCancelText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
