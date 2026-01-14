import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, StatusBar, Modal, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, postMessage, deleteMessage, type Message } from '../services/messages';
import { getRoomMembership, joinRoom, type Room } from '../services/api';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function RoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const room = (route.params as any)?.room as Room;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [nameVisibility, setNameVisibility] = useState<'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'>('anonymous');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showMemberList, setShowMemberList] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkMembershipAndLoad();
    
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [room.id]);

  useEffect(() => {
    if (!membership) return;

    // Set up presence channel for typing indicators
    const channel = supabase.channel(`room:${room.id}:typing`, {
      config: {
        presence: {
          key: user?.id || '',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        const online: string[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== user?.id) {
              online.push(presence.display_name);
              if (presence.typing) {
                typing.push(presence.display_name);
              }
            }
          });
        });
        
        setTypingUsers(typing);
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence - user is online
          await channel.track({
            user_id: user?.id,
            display_name: membership.display_name,
            typing: false,
            online: true,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [membership, room.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  async function checkMembershipAndLoad() {
    try {
      const memberData = await getRoomMembership(room.id);
      if (memberData) {
        setMembership(memberData);
        await loadMessages();
      } else {
        setShowJoinModal(true);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const data = await getMessages(room.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('room_memberships')
        .select('user_id, display_name, anonymity_level, joined_at')
        .eq('room_id', room.id)
        .is('left_at', null)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }

  function handleShowMembers() {
    setShowMemberList(true);
    setMemberSearchQuery('');
    loadMembers();
  }

  function handleCloseMemberList() {
    setShowMemberList(false);
    setMemberSearchQuery('');
  }

  function getFilteredMembers() {
    if (!memberSearchQuery.trim()) return members;
    return members.filter(member => 
      member.display_name.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  }

  function getFilteredMessages() {
    if (!messageSearchQuery.trim()) return messages;
    return messages.filter(message => 
      message.content.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
      message.author_display_name?.toLowerCase().includes(messageSearchQuery.toLowerCase())
    );
  }

  async function handleDeleteMessage(messageId: string) {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(messageId);
              await loadMessages();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete message');
            }
          },
        },
      ]
    );
  }

  function handleMessageLongPress(item: Message) {
    setSelectedMessage(item);
    setShowActionSheet(true);
  }

  async function handleJoinRoom() {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    try {
      const membershipData = await joinRoom(room.id, displayName, nameVisibility);
      console.log('Membership created:', membershipData);
      setMembership(membershipData);
      setShowJoinModal(false);
      
      // Verify membership before loading messages
      const verifyMembership = await getRoomMembership(room.id);
      console.log('Verified membership:', verifyMembership);
      
      await loadMessages();
    } catch (error: any) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', error.message || 'Failed to join room');
    }
  }

  function handleTyping(text: string) {
    setNewMessage(text);

    if (!channelRef.current || !membership) return;

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing status based on whether there's text
    if (text.trim()) {
      // Keep typing indicator active as long as there's text
      channelRef.current.track({
        user_id: user?.id,
        display_name: membership.display_name,
        typing: true,
        online: true,
        online_at: new Date().toISOString(),
      });
    } else {
      // Stop typing when input is cleared
      channelRef.current.track({
        user_id: user?.id,
        display_name: membership.display_name,
        typing: false,
        online: true,
        online_at: new Date().toISOString(),
      });
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Verify membership before sending
      const currentMembership = await getRoomMembership(room.id);
      
      if (!currentMembership) {
        throw new Error('You must join the room before sending messages');
      }

      // Stop typing indicator but stay online
      if (channelRef.current && membership) {
        channelRef.current.track({
          user_id: user?.id,
          display_name: membership.display_name,
          typing: false,
          online: true,
          online_at: new Date().toISOString(),
        });
      }

      console.log('Attempting to send message to room:', room.id);
      await postMessage(room.id, newMessage, replyToMessage?.id || null);
      console.log('Message sent successfully');
      setNewMessage('');
      setReplyToMessage(null);
      await loadMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Show detailed error
      const errorMsg = error.message || 'Unknown error';
      const errorStr = JSON.stringify(error).substring(0, 200);
      Alert.alert('Error Details', `Message: ${errorMsg}\n\nFull error: ${errorStr}`);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwnMessage = item.user_id === user?.id;
    const parentMessage = item.parent_message_id 
      ? messages.find(m => m.id === item.parent_message_id)
      : null;

    function scrollToParentMessage() {
      if (parentMessage) {
        const filteredMessages = getFilteredMessages();
        const index = filteredMessages.findIndex(m => m.id === parentMessage.id);
        if (index !== -1) {
          flatListRef.current?.scrollToIndex({ 
            index, 
            animated: true,
            viewPosition: 0.5 
          });
        }
      }
    }

    return (
      <TouchableOpacity
        style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {parentMessage && (
            <TouchableOpacity 
              style={styles.replyContext}
              onPress={scrollToParentMessage}
              activeOpacity={0.7}
            >
              <View style={styles.replyBar} />
              <View style={styles.replyContent}>
                <Text style={styles.replySender}>{parentMessage.author_display_name}</Text>
                <Text style={styles.replyText} numberOfLines={2}>
                  {parentMessage.content}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <Text style={styles.messageSender}>
            {item.author_display_name}
          </Text>
          <Text style={styles.messageText}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (showJoinModal) {
    return (
      <View style={styles.joinModalContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.joinModal}>
          <Text style={styles.joinTitle}>Join {room.title}</Text>
          <Text style={styles.joinSubtitle}>
            Choose a display name for this room
          </Text>
          <TextInput
            style={styles.joinInput}
            placeholder="Display name"
            placeholderTextColor="#64748b"
            value={displayName}
            onChangeText={setDisplayName}
            autoFocus
          />
          
          <Text style={styles.visibilityLabel}>Name Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                nameVisibility === 'anonymous' && styles.visibilityOptionSelected
              ]}
              onPress={() => setNameVisibility('anonymous')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioButton,
                nameVisibility === 'anonymous' && styles.radioButtonSelected
              ]}>
                {nameVisibility === 'anonymous' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityTitle}>Anonymous</Text>
                <Text style={styles.visibilityDescription}>
                  Your name won't be visible to others
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                nameVisibility === 'verified' && styles.visibilityOptionSelected
              ]}
              onPress={() => setNameVisibility('verified')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioButton,
                nameVisibility === 'verified' && styles.radioButtonSelected
              ]}>
                {nameVisibility === 'verified' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.visibilityContent}>
                <Text style={styles.visibilityTitle}>Visible</Text>
                <Text style={styles.visibilityDescription}>
                  Show your name to other members
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinRoom}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>Join Room</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roomInfo} onPress={handleShowMembers} activeOpacity={0.7}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.roomSubtitle}>
            {onlineUsers.length + 1} online • {room.member_count} members • {messages.length} messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowMessageSearch(!showMessageSearch)} 
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Message Search Bar */}
      {showMessageSearch && (
        <View style={styles.messageSearchContainer}>
          <TextInput
            style={styles.messageSearchInput}
            placeholder="Search messages..."
            placeholderTextColor="#64748b"
            value={messageSearchQuery}
            onChangeText={setMessageSearchQuery}
            autoFocus
          />
          {messageSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setMessageSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={getFilteredMessages()}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {messageSearchQuery ? 'No messages found' : 'No messages yet. Be the first to share!'}
                </Text>
              </View>
            }
          />

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotDelay1]} />
              <View style={[styles.typingDot, styles.typingDotDelay2]} />
              <Text style={styles.typingText}>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                  : `${typingUsers.length} people are typing...`}
              </Text>
            </View>
          )}

          {/* Reply Preview */}
          {replyToMessage && (
            <View style={styles.replyPreviewContainer}>
              <View style={styles.replyPreview}>
                <View style={styles.replyPreviewBar} />
                <View style={styles.replyPreviewContent}>
                  <Text style={styles.replyPreviewSender}>
                    Replying to {replyToMessage.author_display_name}
                  </Text>
                  <Text style={styles.replyPreviewText} numberOfLines={2}>
                    {replyToMessage.content}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setReplyToMessage(null)}
                style={styles.replyPreviewClose}
              >
                <Text style={styles.replyPreviewCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#64748b"
                value={newMessage}
                onChangeText={handleTyping}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.sendIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Member List Modal */}
      <Modal
        visible={showMemberList}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseMemberList}
      >
        <View style={styles.memberModalContainer}>
          <View style={styles.memberModal}>
            <View style={styles.memberModalHeader}>
              <Text style={styles.memberModalTitle}>Members ({members.length})</Text>
              <TouchableOpacity onPress={handleCloseMemberList}>
                <Text style={styles.memberModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.memberSearchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.memberSearchInput}
                placeholder="Search members..."
                placeholderTextColor="#64748b"
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
              {memberSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {loadingMembers ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView style={styles.memberList}>
                {getFilteredMembers().length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      {memberSearchQuery ? 'No members found' : 'No members yet'}
                    </Text>
                  </View>
                ) : (
                  getFilteredMembers().map((member) => {
                  const isOnline = onlineUsers.includes(member.display_name) || member.user_id === user?.id;
                  return (
                    <View key={member.user_id} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.display_name.charAt(0).toUpperCase()}
                        </Text>
                        {isOnline && <View style={styles.onlineIndicator} />}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.display_name}</Text>
                        <Text style={styles.memberStatus}>
                          {isOnline ? 'Online' : 'Offline'} • {member.anonymity_level}
                        </Text>
                      </View>
                    </View>
                  );
                })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Message Action Sheet */}
      <Modal
        visible={showActionSheet}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity 
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.actionSheetContainer}>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                if (selectedMessage) {
                  setReplyToMessage(selectedMessage);
                  setShowActionSheet(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetIcon}>↩️</Text>
              <Text style={styles.actionSheetText}>Reply</Text>
            </TouchableOpacity>

            {selectedMessage?.user_id === user?.id && (
              <TouchableOpacity
                style={[styles.actionSheetItem, styles.actionSheetItemDanger]}
                onPress={() => {
                  setShowActionSheet(false);
                  if (selectedMessage) {
                    Alert.alert(
                      'Delete Message',
                      'Are you sure you want to delete this message?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deleteMessage(selectedMessage.id);
                              await loadMessages();
                            } catch (error: any) {
                              Alert.alert('Error', error.message || 'Failed to delete message');
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.actionSheetIcon}>🗑️</Text>
                <Text style={[styles.actionSheetText, styles.actionSheetTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={() => setShowActionSheet(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingTop: 50,
    paddingBottom: 12,
    paddingLeft: 8,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    marginRight: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  backIcon: {
    fontSize: 36,
    color: '#3b82f6',
    fontWeight: '300',
    lineHeight: 40,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  roomSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchButtonIcon: {
    fontSize: 20,
  },
  messageSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  ownBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
    color: '#ffffff',
  },
  messageText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.6,
  },
  replyContext: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  replyBar: {
    width: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  replyPreviewContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  replyPreview: {
    flex: 1,
    flexDirection: 'row',
  },
  replyPreviewBar: {
    width: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginRight: 12,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  replyPreviewClose: {
    padding: 8,
    marginLeft: 8,
  },
  replyPreviewCloseText: {
    fontSize: 18,
    color: '#64748b',
  },
  inputContainer: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: '#ffffff',
  },  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b',
    marginRight: 3,
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginLeft: 6,
  },  joinModalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  joinModal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  joinSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  joinInput: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  visibilityOptions: {
    marginBottom: 24,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  visibilityOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    color: '#94a3b8',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  memberModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  memberModal: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  memberModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  memberModalClose: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '300',
  },
  memberSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  memberSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearSearchIcon: {
    fontSize: 18,
    color: '#64748b',
    paddingLeft: 8,
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#64748b',
  },
  memberList: {
    padding: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 13,
    color: '#94a3b8',
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
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
