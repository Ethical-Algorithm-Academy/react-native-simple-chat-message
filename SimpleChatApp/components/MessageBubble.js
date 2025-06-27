import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

const defaultMessage = {
  seen: false,
  text: "Default",
  title: "Default",
  numbernewmessages: 0,
  timestamp: new Date("2025-06-24T12:00:00"),
  sender: "none",
};

const MessageBubble = ({ message = {}, filter = "", onpress }) => {
  const msg = { ...defaultMessage, ...message };
  const isCurrentUser = msg.sender === 'You';

  // Highlight logic
  const title = msg.title;
  const filterLower = filter.toLowerCase();
  const titleLower = title.toLowerCase();
  const matchIndex = filter ? titleLower.indexOf(filterLower) : -1;

  let titleContent;
  if (matchIndex !== -1 && filter) {
    titleContent = (
      <Text style={styles.title}>
        {title.substring(0, matchIndex)}
        <Text style={styles.highlight}>
          {title.substring(matchIndex, matchIndex + filter.length)}
        </Text>
        {title.substring(matchIndex + filter.length)}
      </Text>
    );
  } else {
    titleContent = <Text style={styles.title}>{title}</Text>;
  }

  function formatMessageTimeOrDate(date) {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onpress}
    >
      <View style={styles.row}>
        {msg.type == "group" ? (
          <Ionicons
            name="people-circle"
            size={60}
            color="#bbb"
            style={styles.avatar}
          />
        ) : (
          <Ionicons
            name="person-circle"
            size={60}
            color="#bbb"
            style={styles.avatar}
          />
        )}

        <View style={styles.content}>
          <View style={styles.uppertext}>
            {titleContent}
            <Text style={styles.time}>
              {msg.timestamp
                ? formatMessageTimeOrDate(new Date(msg.timestamp))
                : ""}
            </Text>
          </View>
          <View style={styles.lowertext}>
            <View style={styles.textplusicon}>
              <View style={styles.icon}>
                {isCurrentUser && (
                  msg.seen ? (
                    <Ionicons name="checkmark-done" size={16} color="blue" />
                  ) : (
                    <Ionicons name="checkmark" size={16} color="gray" />
                  )
                )}
              </View>
              <Text
                style={[
                  styles.textwithoutnumber,
                  msg.numbernewmessages && styles.text,
                  !isCurrentUser && !msg.seen && styles.unseenText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {msg.type === 'group' && msg.sender ? (
                  <Text style={styles.senderName}>{msg.sender}: </Text>
                ) : null}
                {msg.type === 'individual' && msg.sender === 'You' ? (
                  <Text style={styles.senderName}>You: </Text>
                ) : null}
                {msg.text}
              </Text>
            </View>
            {msg.numbernewmessages > 0 && (
              <View style={styles.numbernewmessagescontainer}>
                <Text style={styles.numbernewmessages}>
                  {msg.numbernewmessages >= 100 ? '99+' : msg.numbernewmessages}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "rgb(110, 110, 110)",
    paddingVertical: RFValue(8),
    flexShrink: 1,
  },
  textplusicon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textwithoutnumber: {
    color: "rgb(110, 110, 110)",
    paddingVertical: RFValue(8),
    flexShrink: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: RFValue(16),
  },
  container: {
    width: "100%",
    marginVertical: RFValue(8),
  },
  uppertext: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lowertext: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  time: {
    color: "rgb(110, 110, 110)",
  },
  numbernewmessagescontainer: {
    backgroundColor: "gray",
    width: RFValue(24),
    height: RFValue(16),
    borderRadius: RFValue(12),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: RFValue(8),
  },
  numbernewmessages: {
    color: "white",
    fontWeight: "bold",
    fontSize: RFValue(12),
  },
  icon: {
    paddingRight: 5,
  },
  pressed: {
    opacity: 0.6,
    borderColor: "red",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderColor: "green",
  },
  avatar: {
    marginRight: RFValue(8),
  },
  content: {
    flex: 1,
  },
  highlight: {
    backgroundColor: "#ffe066",
    color: "#000",
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderName: {
    fontWeight: 'bold',
    color: '#222',
  },
  unseenText: {
    fontWeight: 'bold',
    color: '#222',
  },
});

export default MessageBubble;
