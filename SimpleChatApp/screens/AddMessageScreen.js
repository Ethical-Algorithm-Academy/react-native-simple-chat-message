// SimpleChatApp/screens/AddMessageScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../components/ScreenContainer";
import SearchBar from "../components/SearchBar";
import ScreenTitle from "../components/ScreenTitle";
import { RFValue } from "react-native-responsive-fontsize";
import { supabase } from "../lib/supabase";
import AddMensage from "../components/AddMessage";
import { useSnackbar } from "../contexts/SnackbarContext";
import { NAV_MESSAGEDETAILS_SCREEN } from "../constants/navigation";

function highlightText(text, filter, style) {
  if (!filter) return <Text style={style}>{text}</Text>;
  const lowerText = text?.toLowerCase() || "";
  const lowerFilter = filter.toLowerCase();
  const start = lowerText.indexOf(lowerFilter);
  if (start === -1) return <Text style={style}>{text}</Text>;
  const end = start + filter.length;
  return (
    <Text style={style}>
      {text.substring(0, start)}
      <Text style={styles.highlight}>{text.substring(start, end)}</Text>
      {text.substring(end)}
    </Text>
  );
}

function UserListItem({ name, email, checked, onPress, filter }) {
  return (
    <Pressable onPress={onPress} style={styles.userItemContainer}>
      <View style={styles.checkboxContainer}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </View>
      <Ionicons name="person-circle" size={28} color="#888" style={styles.profileIcon} />
      <View style={styles.userInfo}>
        {highlightText(name || 'No name', filter, styles.userName)}
        {highlightText(email || 'No email', filter, styles.userEmail)}
      </View>
    </Pressable>
  );
}

function getRandomChannelName() {
  const adjectives = ["Cool", "Fun", "Secret", "Chill", "Epic", "Quick", "Smart", "Happy"];
  const nouns = ["Group", "Squad", "Team", "Chat", "Room", "Circle", "Crew", "Club"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

function AddMessageScreen() {
  const [filter, setFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const { showSuccess, showError, showInfo } = useSnackbar();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const [{ data: userData }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("users").select("id, name, email"),
      ]);
      const userId = userData?.user?.id;
      setCurrentUserId(userId);
      console.log('Current user:', userData);
      if (error) {
        setUsers([]);
      } else {
        setUsers((data || []).filter(u => u.id !== userId));
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = filter
    ? users.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(filter.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(filter.toLowerCase()))
      )
    : users;

  const toggleSelect = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createChannel = async () => {
    if (Object.keys(selected).length === 0) {
      showInfo("Please select at least one user to create a channel.");
      return;
    }
    const channelName = getRandomChannelName();
    const selectedUserIds = Object.keys(selected).filter(id => selected[id]);
    // Determine type
    const isGroup = selectedUserIds.length + 1 > 2; // +1 for the creator
    const channelType = isGroup ? 'group' : 'individual';
    // 1. Create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert([{ name: channelName, type: channelType }])
      .select()
      .single();
    console.log('Channel insert result:', channel, channelError);
    if (channelError) {
      showError('Error creating channel: ' + channelError.message);
      return;
    }
    // 2. Add users to user_channels
    const userChannelRows = selectedUserIds.map(user_id => ({
      user_id,
      channel_id: channel.id,
    }));
    if (!userChannelRows.some(row => row.user_id === currentUserId)) {
      userChannelRows.push({ user_id: currentUserId, channel_id: channel.id });
    }
    const { error: userChannelsError, data: userChannelsData } = await supabase
      .from('user_channels')
      .insert(userChannelRows);
    console.log('User channels insert result:', userChannelsData, userChannelsError);
    if (userChannelsError) {
      showError('Error adding users to channel: ' + userChannelsError.message);
      return;
    }
    showSuccess(`Channel '${channelName}' created!`);
    navigation.replace(NAV_MESSAGEDETAILS_SCREEN, { channelId: channel.id });
  };

  return (
    
      <ScreenContainer>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={20}
              color="#000"
              style={styles.arrowIcon}
            />
          </Pressable>
          <View style={styles.title}>
            <ScreenTitle title="New Message" textAlign="left" fontSize={20} marginBottom={0}/>
            <Text>Select contacts to start messaging</Text>
          </View>
        </View>

        <SearchBar
          placeholder="Search contacts by name or email..."
          value={filter}
          onChangeText={setFilter}
        />
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              name={item.name}
              email={item.email}
              checked={!!selected[item.id]}
              onPress={() => toggleSelect(item.id)}
              filter={filter}
            />
          )}
          ListEmptyComponent={
            loading ? <Text>Loading...</Text> : <Text>No users found.</Text>
          }
        />
          <AddMensage onPress={createChannel} />
      </ScreenContainer>
    
    
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFValue(4),
  },
  arrowIcon: {
    marginLeft: RFValue(4),
  },
  title:{ 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: RFValue(6),
    marginLeft: RFValue(16),
  },
  userItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  profileIcon: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  highlight: {
    backgroundColor: "#ffe066",
    color: "#000",
    borderRadius: 3,
    paddingHorizontal: 2,
  },
});

export default AddMessageScreen;
