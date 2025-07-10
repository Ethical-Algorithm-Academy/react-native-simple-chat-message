import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

import {
  NAV_CONFIGURATIONS_SCREEN,
  NAV_ADDMESSAGE_SCREEN,
  NAV_MESSAGEDETAILS_SCREEN,
} from "../constants/navigation";

import ScreenContainer from "../components/ScreenContainer";
import ScreenTitle from "../components/ScreenTitle";
import MessageBubble from "../components/MessageBubble";
import Divider from "../components/Divider";
import AddMensage from "../components/AddMessage";
import SearchBar from "../components/SearchBar";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";

// Key for storing FCM tokens by user in AsyncStorage
const FCM_TOKEN_KEY = 'fcm_tokens_by_user';

// Get all locally stored tokens
const getStoredFcmTokens = async () => {
  const json = await AsyncStorage.getItem(FCM_TOKEN_KEY);
  return json ? JSON.parse(json) : {};
};

// Store token for a user
const storeFcmTokenForUser = async (userId, token) => {
  const tokens = await getStoredFcmTokens();
  tokens[userId] = token;
  await AsyncStorage.setItem(FCM_TOKEN_KEY, JSON.stringify(tokens));
};

// Get token for a user
export const getFcmTokenForUser = async (userId) => {
  const tokens = await getStoredFcmTokens();
  return tokens[userId];
};

// Add token for a user to Supabase array if not present
const addFcmTokenToSupabase = async (userId, token) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('fcm_tokens')
    .eq('id', userId)
    .single();
  if (!error && user) {
    let tokens = user.fcm_tokens || [];
    if (!Array.isArray(tokens)) {
      tokens = [];
    }
    if (!tokens.includes(token)) {
      const newTokens = [...tokens, token];
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ fcm_tokens: newTokens })
        .eq('id', userId)
        .select();
      if (updateError) {
      } else {
      }
    }
  }
};

// Utility function to wait until the WebSocket connection is open before subscribing
async function waitForSocketOpen(socket, timeout = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (socket.conn.readyState === 1) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error("WebSocket did not open in time"));
      } else {
        setTimeout(check, 50);
      }
    }
    check();
  });
}

// Request permission and get token
const getFcmTokenWithFirebase = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    return null;
  }

  const token = await messaging().getToken();
  return token;
};

function MainApp() {
  //console.log('==== MainApp component rendered ====');
  const [filter, setFilter] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { showError, showSuccess } = useSnackbar();
  const navigation = useNavigation();
  const subscriptionStatusRef = React.useRef(null);

  const fetchChannels = useCallback(async () => {
    if (!currentUserId) return;

    const { data: userChannels, error: userChannelsError } = await supabase
      .from("user_channels")
      .select("channel_id")
      .eq("user_id", currentUserId);

    if (userChannelsError) {
      showError(userChannelsError.message);
      setChannels([]);
      return;
    }

    const channelIds = (userChannels || []).map((row) => row.channel_id);
    if (channelIds.length === 0) {
      setChannels([]);
      return;
    }

    const { data: channelsData, error: channelsError } = await supabase
      .from("channels")
      .select(
        `
        id,
        name,
        type,
        created_at,
        user_channels(user_id, users(id, name)),
        messages:messages!messages_channel_id_fkey(
          id, content, sent_at, user_id, seen
        )
      `
      )
      .in("id", channelIds)
      .order("sent_at", { foreignTable: "messages", ascending: false })
      .limit(100, { foreignTable: "messages" });

    if (channelsError) {
      showError(channelsError.message);
      setChannels([]);
    } else {
      setChannels(channelsData || []);
    }
  }, [currentUserId, showError]);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        setCurrentUserId(user.id);

        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role) {
          setUserRole(userData.role);
        }
        if (error) {
          showError(error.message);
        }
      }
    };
    fetchUserRole();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const setup = async () => {
        if (!currentUserId) return;
        // Fetch the latest channels for the user
        fetchChannels();
        // --- WebSocket/channel subscription logic ---
        // Get the current open channels from Supabase client
        const channels = supabase.getChannels();
        // Try to get the socket from the first channel (if any exist)
        const socket = channels[0]?.socket;
        // If a socket exists and has a connection object, wait for it to be open
        if (
          socket &&
          socket.conn &&
          typeof socket.conn.readyState !== "undefined"
        ) {
          try {
            // Wait until the WebSocket is open before subscribing
            await waitForSocketOpen(socket);
          } catch (e) {
            return;
          }
        }
        // Now that the socket is open (or there was no socket), subscribe to the channel
        const subscription = supabase
          .channel("messages_realtime_mainapp")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "messages" },
            (payload) => {
              if (isActive) {
                // On message change, refetch channels
                fetchChannels();
              }
            }
          )
          .subscribe((status) => {
          });
        // Cleanup function to remove the channel subscription when the screen is unfocused or component unmounts
        return () => {
          isActive = false;
          supabase.removeChannel(subscription);
        };
      };
      setup();
      // Synchronous cleanup to mark effect as inactive
      return () => {
        isActive = false;
      };
    }, [currentUserId, fetchChannels])
  );

  const sortedChannels = [...channels].sort((a, b) => {
    const aTime = a.messages?.[0]?.sent_at
      ? new Date(a.messages[0].sent_at).getTime()
      : new Date(a.created_at || 0).getTime();
    const bTime = b.messages?.[0]?.sent_at
      ? new Date(b.messages[0].sent_at).getTime()
      : new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  const renderItem = ({ item }) => {
    // Get the channel name
    let title = item.name;
    if (item.type === "individual" && item.user_channels) {
      const otherUser = item.user_channels
        .map((uc) => uc.users)
        .find((u) => u && u.id !== currentUserId);
      if (otherUser?.name) {
        title = otherUser.name;
      }
    }

    // Get the last message sent
    const lastMessage = item.messages?.[0] ?? null;
    let numbernewmessages = 0;

    // Calculate number of unseen messages for the current user, limit to 100 (99+)
    if (item.messages) {
      const unseen = item.messages.filter(
        (m) => m.user_id !== currentUserId && !m.seen
      );
      numbernewmessages = unseen.length;
    }

    // Get the name of the person who sent the last message
    let sender = "";
    if (lastMessage) {
      if (lastMessage.user_id === currentUserId) {
        sender = "You";
      } else if (item.type === "group" && item.user_channels) {
        const senderUser = item.user_channels
          .map((uc) => uc.users)
          .find((u) => u && u.id === lastMessage.user_id);
        sender = senderUser?.name || "";
      } else if (item.type === "individual" && item.user_channels) {
        const otherUser = item.user_channels
          .map((uc) => uc.users)
          .find((u) => u && u.id !== currentUserId);
        sender = otherUser?.name || "";
      }
    }

    // Compose the message preview title and text
    let previewTitle = item.type === "group" ? item.name : title;
    let previewText = lastMessage
      ? lastMessage.content
      : "This channel is empty";
    if (
      lastMessage &&
      (!lastMessage.content || lastMessage.content.trim() === "") &&
      lastMessage.file_type
    ) {
      if (lastMessage.file_type.startsWith("image/")) {
        previewTitle = "(Image)";
        previewText = "(Image)";
      } else if (lastMessage.file_type.startsWith("video/")) {
        previewTitle = "(Video)";
        previewText = "(Video)";
      } else {
        previewTitle = "(File)";
        previewText = "(File)";
      }
    }

    // Sends the values
    const message = {
      id: item.id,
      title: previewTitle,
      type: item.type,
      text: previewText,
      content: previewText,
      timestamp: lastMessage ? lastMessage.sent_at : "",
      sender,
      seen: lastMessage?.seen ?? false,
      numbernewmessages,
    };
    
    return (
      <MessageBubble
        message={message}
        filter={filter}
        onpress={() =>
          navigation.navigate(NAV_MESSAGEDETAILS_SCREEN, {
            channelId: item.id,
          })
        }
      />
    );
  };

  // Call this after successful login (when you have userId)
  const handleLoginFcmToken = useCallback(async (userId) => {
    try {
      // Request notification permissions first
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Notification permission not granted. Token will not be added.');
        return;
      }
      let token = await getFcmTokenForUser(userId);
      if (!token) {
        token = await getFcmTokenWithFirebase();
        if (!token) {
          return;
        }
        await storeFcmTokenForUser(userId, token);
      }
      // Add token to Supabase if not already present
      await addFcmTokenToSupabase(userId, token);
    } catch (e) {
    }
  }, []);

  // Example: Call handleLoginFcmToken when user logs in
  useEffect(() => {
    if (currentUserId) {
      handleLoginFcmToken(currentUserId);
    }
  }, [currentUserId, handleLoginFcmToken]);

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      if (currentUserId) {
        await storeFcmTokenForUser(currentUserId, newToken);
        await addFcmTokenToSupabase(currentUserId, newToken);
      }
    });
    return unsubscribe;
  }, [currentUserId]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ScreenTitle title="Messages" textAlign="left" />
        <View style={{ flexDirection: "row" }}>      
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => navigation.navigate(NAV_CONFIGURATIONS_SCREEN)}
          >
            <Icon name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        placeholder="Search conversations..."
        value={filter}
        onChangeText={setFilter}
      />

      <Divider fullcontainer={true} />

      {currentUserId && (
        <FlatList
          data={sortedChannels.filter((ch) =>
            ch.type === "group"
              ? ch.name.toLowerCase().includes(filter.toLowerCase())
              : renderItem({ item: ch })
                  .props.message.title.toLowerCase()
                  .includes(filter.toLowerCase())
          )}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
        />
      )}

      {(userRole === "admin" || userRole === "manager") && (
        <AddMensage
          onPress={() => navigation.navigate(NAV_ADDMESSAGE_SCREEN)}
        />
      )}
      {/* Regular user: show AddMessage only if no channels */}
      {userRole && userRole !== "admin" && userRole !== "manager" && channels.length === 0 && (
        <AddMensage
          onPress={async () => {
            try {
              // Fetch all managers
              const { data: managers, error: managerError } = await supabase
                .from('users')
                .select('id, name')
                .eq('role', 'manager');
              if (managerError || !managers || managers.length === 0) {
                showError('No managers available.');
                return;
              }
              // Pick a random manager
              const randomManager = managers[Math.floor(Math.random() * managers.length)];
              if (!randomManager) {
                showError('No manager found.');
                return;
              }
              // Create a random channel name
              const getRandomChannelName = () => {
                const adjectives = ["Cool", "Fun", "Secret", "Chill", "Epic", "Quick", "Smart", "Happy"];
                const nouns = ["Group", "Squad", "Team", "Chat", "Room", "Circle", "Crew", "Club"];
                const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
                const noun = nouns[Math.floor(Math.random() * nouns.length)];
                return `${adj} ${noun}`;
              };
              const channelName = getRandomChannelName();
              // Create the channel
              const { data: channel, error: channelError } = await supabase
                .from('channels')
                .insert([{ name: channelName, type: 'individual' }])
                .select()
                .single();
              if (channelError || !channel) {
                showError('Error creating channel: ' + (channelError?.message || 'Unknown error'));
                return;
              }
              // Add both users to user_channels
              const userChannelRows = [
                { user_id: currentUserId, channel_id: channel.id },
                { user_id: randomManager.id, channel_id: channel.id },
              ];
              const { error: userChannelsError } = await supabase
                .from('user_channels')
                .insert(userChannelRows);
              if (userChannelsError) {
                showError('Error adding users to channel: ' + userChannelsError.message);
                return;
              }
              showSuccess(`Channel with manager '${randomManager.name}' created!`);
              navigation.navigate(NAV_MESSAGEDETAILS_SCREEN, { channelId: channel.id });
            } catch (e) {
              showError('Unexpected error creating channel.');
            }
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  configButton: {
    padding: 8,
  },
  messageList: {
    flexGrow: 1,
    width: "100%",
  },
});

export default MainApp;
