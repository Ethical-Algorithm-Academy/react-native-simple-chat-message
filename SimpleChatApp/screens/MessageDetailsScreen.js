import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  React,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { RFValue } from "react-native-responsive-fontsize";

import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import Video from 'react-native-video';

import ScreenContainer from "../components/ScreenContainer";
import LoadingScreen from "../components/LoadingScreen";
import ChatMessageBubble from "../components/ChatMessageBubble";

import { supabase } from "../lib/supabase";
import { groupMessagesWithSections } from "../lib/chatUtils";
import { uploadFileToSupabase, MAX_FILE_SIZE } from "../lib/fileUpload";
import { useSnackbar } from '../contexts/SnackbarContext';

function MessageDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { channelId } = route.params;
  const [title, setTitle] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [channelType, setChannelType] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const hasScrolledToEnd = useRef(false);
  const currentUserIdRef = useRef(currentUserId);
  const flatListRef = useRef();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  const { showError, showWarning, showSuccess, showInfo } = useSnackbar();

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, content, sent_at, user_id, seen, users(name), file_url, file_type, file_name, file_size"
      )
      .eq("channel_id", channelId)
      .order("sent_at", { ascending: true });
    if (!error) {
      setMessages(data || []);
    }
  }, [channelId]);

  useEffect(() => {
    const fetchChannel = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      setCurrentUserId(userId);
      console.log("Set currentUserId:", userId);
      const { data: channel, error } = await supabase
        .from("channels")
        .select("id, name, type, user_channels(user_id, users(id, name))")
        .eq("id", channelId)
        .single();
      if (error || !channel) {
        setTitle("Channel not found");
        setChannelType("");
        return;
      }
      setChannelType(channel.type);
      if (channel.type === "group") {
        setTitle(channel.name);
      } else if (channel.type === "individual" && channel.user_channels) {
        const otherUser = channel.user_channels
          .map((uc) => uc.users)
          .find((u) => u && u.id !== userId);
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
      .channel("messages_realtime_" + channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
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
          .from("messages")
          .update({ seen: true })
          .eq("id", item.id);
        if (!error) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === item.id ? { ...msg, seen: true } : msg
            )
          );
        }
      }
    });
  }).current;

  const getPublicFileUrl = (filePath) => {
    const { data } = supabase.storage
      .from("simple-chat-bucket")
      .getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const renderItem = useCallback(
    ({ item }) => {
      if (item.section) {
    return (
      <View
            style={{
              alignItems: "center",
              marginVertical: 6,
              marginHorizontal: 0,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: "#888",
                fontSize: RFValue(13),
                paddingHorizontal: 8,
              }}
            >
              {item.label}
          </Text>
      </View>
    );
      }
      // Attach publicUrl to item for ChatMessageBubble
      let publicUrl = null;
      if (item.file_url) {
        publicUrl = getPublicFileUrl(item.file_url);
      }
      return (
        <ChatMessageBubble
          item={{ ...item, publicUrl }}
          isCurrentUser={item.user_id === currentUserId}
          channelType={channelType}
          onImagePress={(url) => {
            setModalImageUrl(url);
            setImageModalVisible(true);
          }}
          onVideoPress={(url) => {
            setModalVideoUrl(url);
            setVideoModalVisible(true);
          }}
          styles={styles}
        />
      );
    },
    [currentUserId, channelType]
  );

  const lastIndex = messages.length > 0 ? messages.length - 1 : 0;

  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // px
    setIsAtBottom(
      layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
    );
  }, []);

  const getItemLayout = (data, index) => ({
    length: 80, // approximate row height, adjust as needed
    offset: 80 * index,
    index,
  });

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      console.log("DocumentPicker result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > MAX_FILE_SIZE) {
          showWarning("The selected file exceeds the 10MB limit. Please choose a smaller file.");
          return;
        }
        showInfo("Selected: " + file.name);
        setSelectedFile(file);
      } else {
        showInfo("No file selected or cancelled");
      }
    } catch (e) {
      console.log("DocumentPicker error:", e);
      showError("Error: " + e.message);
    }
  };

  const sendMessage = async () => {
    console.log('[sendMessage] called');
    if ((!newMessage.trim() && !selectedFile) || !currentUserId) {
      console.log('[sendMessage] No message or file, or no user. Aborting.');
      return;
    }
    setSending(true);
    console.log('[sendMessage] setSending(true)');

    try {
      console.log('[sendMessage] Entered try block');
      let fileInfo = null;
      if (selectedFile) {
        console.log('[sendMessage] Uploading file:', selectedFile);
        fileInfo = await uploadFileToSupabase(selectedFile, channelId);
        console.log('[sendMessage] After uploadFileToSupabase, fileInfo:', fileInfo);
        fileInfo.fileSize = selectedFile.size;
      }

      const messagePayload = {
        content: newMessage.trim(),
          user_id: currentUserId,
          channel_id: channelId,
        ...(fileInfo && {
          file_url: fileInfo.filePath,
          file_type: fileInfo.fileType,
          file_name: fileInfo.fileName,
          file_size: fileInfo.fileSize,
        }),
      };
      console.log('[sendMessage] Prepared messagePayload:', messagePayload);

      console.log('[sendMessage] Awaiting supabase insert...');
      const { data, error } = await supabase
        .from("messages")
        .insert([messagePayload])
      .select()
      .single();
      console.log('[sendMessage] Supabase insert result:', { data, error });

      if (error) {
        console.log('[sendMessage] Supabase insert error:', error);
        showError(error.message || "Failed to send message");
        return;
      }

      setMessages((prev) => [...prev, data]);
      console.log('[sendMessage] setMessages called with new data');
      setNewMessage("");
      console.log('[sendMessage] setNewMessage("")');
      setSelectedFile(null);
      console.log('[sendMessage] setSelectedFile(null)');
      // Scroll to bottom if user is at bottom
      if (isAtBottom && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          console.log('[sendMessage] flatListRef.current?.scrollToEnd called');
        }, 50);
      }
    } catch (error) {
      console.error('[sendMessage] Error in catch block:', error);
      showError("Failed to send message");
    } finally {
      console.log('[sendMessage] Entered finally block');
      setSending(false);
      console.log('[sendMessage] setSending(false)');
    }
  };

  const messagesWithSections = useMemo(
    () => groupMessagesWithSections(messages),
    [messages]
  );

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messagesWithSections.length]);

  if (!currentUserId) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.arrowIcon}>
          <Ionicons name="arrow-back" size={RFValue(24)} color="#000" />
        </Pressable>
        <Ionicons
          name={channelType === "group" ? "people-circle" : "person-circle"}
          size={RFValue(36)}
          color="#888"
          style={styles.profileIcon}
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* MESSAGES LIST */}
        <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messagesWithSections}
          keyExtractor={(item) => item.id?.toString() || item.dateStr}
          renderItem={renderItem}
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
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={true}
        />
      </View>

      {/* FOOTER / INPUT */}
      <KeyboardAvoidingView>
          <View style={styles.inputContainerWrapper}>
          {selectedFile && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
                marginLeft: 8,
              }}
            >
              <Ionicons
                name="document-attach-outline"
                size={20}
                color="#888"
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: "#333", fontSize: 14, flexShrink: 1 }}>
                {selectedFile.name}
              </Text>
              <Pressable
                onPress={() => setSelectedFile(null)}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#888" />
              </Pressable>
            </View>
          )}
            <View style={styles.inputContainer}>
            {/* Attach File Button (moved to left, black color) */}
            <Pressable
              onPress={handleFilePick}
              style={{ padding: RFValue(8), marginRight: RFValue(4) }}
            >
              <Ionicons name="attach-outline" size={RFValue(24)} color="#888" />
            </Pressable>
              <TextInput
              style={[styles.textInput, { backgroundColor: "#f8f8f8" }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
              placeholderTextColor="#222"
                editable={!sending}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <Pressable
                onPress={sendMessage}
                style={styles.sendButton}
              disabled={sending || (!newMessage.trim() && !selectedFile)}
              >
              {sending ? (
                <ActivityIndicator size={24} color="#007AFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={RFValue(24)}
                  color={
                    sending || (!newMessage.trim() && !selectedFile)
                      ? "#888"
                      : "#007AFF"
                  }
                />
              )}
              </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setImageModalVisible(false)}
          />
          {modalImageUrl && (
            <Image
              source={{ uri: modalImageUrl }}
              style={{
                width: "90%",
                height: "70%",
                resizeMode: "contain",
                borderRadius: 16,
                backgroundColor: "#222",
              }}
            />
          )}
        </View>
      </Modal>
      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setVideoModalVisible(false)}
          />
          {modalVideoUrl && (
            <Video
              source={{ uri: modalVideoUrl }}
              style={{ width: '90%', height: '50%', borderRadius: 16, backgroundColor: '#222' }}
              controls
              resizeMode="contain"
              paused={false}
            />
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "bold",
    flex: 1,
  },
  messagesList: {
    paddingVertical: RFValue(8),
    justifyContent: "flex-end",
  },
  messageBubble: {
    borderRadius: RFValue(12),
    padding: RFValue(12),
    marginBottom: RFValue(8),
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#e3f0ff",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: RFValue(16),
    color: "#222",
  },
  messageTime: {
    fontSize: RFValue(12),
    color: "#888",
    marginTop: RFValue(4),
    textAlign: "right",
  },
  messageTimeLeft: {
    textAlign: "left",
  },
  inputContainerWrapper: {
    backgroundColor: "#fff",
    paddingBottom: RFValue(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: RFValue(8),
    paddingVertical: RFValue(4),
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(16),
    padding: RFValue(10),
    borderRadius: RFValue(20),
    backgroundColor: "#f8f8f8",
    marginRight: RFValue(8),
  },
  sendButton: {
    padding: RFValue(8),
  },
  senderName: {
    fontWeight: "bold",
    color: "#222",
  },
});

export default MessageDetails;
