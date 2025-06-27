import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import ScreenContainer from '../components/ScreenContainer';
import LoadingScreen from '../components/LoadingScreen';

function MessageDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { channelId } = route.params;
  const [title, setTitle] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [channelType, setChannelType] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const hasScrolledToEnd = useRef(false);
  const currentUserIdRef = useRef(currentUserId);
  const flatListRef = useRef();
  const [isAtBottom, setIsAtBottom] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sent_at, user_id, seen, users(name)')
      .eq('channel_id', channelId)
      .order('sent_at', { ascending: true });
    if (!error) {
      setMessages(data || []);
    }
  }, [channelId]);

  useEffect(() => {
    const fetchChannel = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      setCurrentUserId(userId);
      console.log('Set currentUserId:', userId);
      const { data: channel, error } = await supabase
        .from('channels')
        .select('id, name, type, user_channels(user_id, users(id, name))')
        .eq('id', channelId)
        .single();
      if (error || !channel) {
        setTitle('Channel not found');
        setChannelType('');
        return;
      }
      setChannelType(channel.type);
      if (channel.type === 'group') {
        setTitle(channel.name);
      } else if (channel.type === 'individual' && channel.user_channels) {
        const otherUser = channel.user_channels
          .map(uc => uc.users)
          .find(u => u && u.id !== userId);
        setTitle(otherUser && otherUser.name ? otherUser.name : channel.name);
      } else {
        setTitle(channel.name);
      }
    };
    fetchChannel();
  }, [channelId]);

  useEffect(() => {
    fetchMessages();

    // Use a ref to always have the latest fetchMessages
    const fetchMessagesRef = { current: fetchMessages };
    fetchMessagesRef.current = fetchMessages;

    const subscription = supabase
      .channel('messages_realtime_' + channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelId, fetchMessages]);

  useEffect(() => {
    hasScrolledToEnd.current = false;
  }, [channelId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    const userId = currentUserIdRef.current;
    if (!userId) {
      return;
    }
    viewableItems.forEach(async ({ item }) => {
      if (
        item.id && // skip section headers
        !item.section &&
        item.user_id !== userId &&
        !item.seen
      ) {
        const { error, data } = await supabase
          .from('messages')
          .update({ seen: true })
          .eq('id', item.id);
        if (!error) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === item.id ? { ...msg, seen: true } : msg
            )
          );
        }
      }
    });
  }).current;

  const renderMessage = (item) => {
    const isCurrentUser = item.user_id === currentUserId;
    let senderName = '';
    if (channelType === 'group') {
      senderName = isCurrentUser ? 'You' : (item.users && item.users.name ? item.users.name : '');
    }
    // Format time and date
    const sentDate = new Date(item.sent_at);
    const now = new Date();
    const isToday = sentDate.getDate() === now.getDate() &&
      sentDate.getMonth() === now.getMonth() &&
      sentDate.getFullYear() === now.getFullYear();
    let timeString = sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Only show hour, date is in section header
    let timeDisplay = timeString;
    return (
      <View
        key={item.id}
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>
          {channelType === 'group' && senderName ? <Text style={styles.senderName}>{senderName}: </Text> : null}
          {item.content}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: isCurrentUser ? 'flex-end' : 'flex-start' }}>
          <Text style={isCurrentUser ? styles.messageTime : [styles.messageTime, styles.messageTimeLeft]}>
            {timeDisplay}
          </Text>
          {isCurrentUser && (
            item.seen ? (
              <Ionicons name="checkmark-done" size={16} color="blue" style={{ marginLeft: 6 }} />
            ) : (
              <Ionicons name="checkmark" size={16} color="gray" style={{ marginLeft: 6 }} />
            )
          )}
        </View>
      </View>
    );
  };

  const lastIndex = messages.length > 0 ? messages.length - 1 : 0;

  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // px
    setIsAtBottom(
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
    );
  }, []);

  const getItemLayout = (data, index) => ({
    length: 80, // approximate row height, adjust as needed
    offset: 80 * index,
    index,
  });

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content: newMessage,
          user_id: currentUserId,
          channel_id: channelId,
        },
      ])
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      // Only scroll to bottom if user is at bottom
      if (isAtBottom && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    }
  };

  // Group messages by day and insert date sections
  function groupMessagesWithSections(messages) {
    if (!messages.length) return [];
    const now = new Date();
    const todayStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const groups = {};
    messages.forEach(msg => {
      const dateObj = new Date(msg.sent_at);
      const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(msg);
    });
    // Build the array with section headers
    const result = [];
    Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).forEach(dateStr => {
      result.push({ section: true, dateStr, label: dateStr === todayStr ? 'Today' : dateStr });
      result.push(...groups[dateStr]);
    });
    return result;
  }

  const messagesWithSections = groupMessagesWithSections(messages);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messagesWithSections.length]);

  if (!currentUserId) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.arrowIcon}>
          <Ionicons name="arrow-back" size={RFValue(24)} color="#000" />
        </Pressable>
        <Ionicons
          name={channelType === 'group' ? 'people-circle' : 'person-circle'}
          size={RFValue(36)}
          color="#888"
          style={styles.profileIcon}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <View style={{ flex: 1 }}>
          {currentUserId && (
            <FlatList
              ref={flatListRef}
              data={messagesWithSections}
              keyExtractor={item => item.id?.toString() || item.dateStr}
              renderItem={({ item }) => {
                if (item.section) {
                  return (
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <Text style={{ fontWeight: 'bold', color: '#888', fontSize: RFValue(13) }}>{item.label}</Text>
                    </View>
                  );
                }
                return renderMessage(item);
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesList}
              initialScrollIndex={lastIndex}
              getItemLayout={getItemLayout}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />
          )}
          <View style={styles.inputContainerWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                editable={!sending}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <Pressable
                onPress={sendMessage}
                style={styles.sendButton}
                disabled={sending || !newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={RFValue(24)}
                  color={sending || !newMessage.trim() ? '#ccc' : '#007AFF'}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFValue(8),
  },
  arrowIcon: {
    marginRight: RFValue(8),
    padding: RFValue(4),
  },
  profileIcon: {
    marginRight: RFValue(12),
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    flex: 1,
  },
  messagesList: {
    paddingVertical: RFValue(8),
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: RFValue(12),
    padding: RFValue(12),
    marginBottom: RFValue(8),
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: RFValue(16),
    color: '#222',
  },
  messageTime: {
    fontSize: RFValue(12),
    color: '#888',
    marginTop: RFValue(4),
    textAlign: 'right',
  },
  messageTimeLeft: {
    textAlign: 'left',
  },
  inputContainerWrapper: {
    backgroundColor: '#fff',
    paddingBottom: RFValue(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: RFValue(8),
    paddingVertical: RFValue(4),
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(16),
    padding: RFValue(10),
    borderRadius: RFValue(20),
    backgroundColor: '#f1f1f1',
    marginRight: RFValue(8),
  },
  sendButton: {
    padding: RFValue(8),
  },
  senderName: {
    fontWeight: 'bold',
    color: '#222',
  },
});

export default MessageDetails;