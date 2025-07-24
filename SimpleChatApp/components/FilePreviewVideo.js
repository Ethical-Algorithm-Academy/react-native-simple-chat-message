// FilePreviewVideo.js
import React from "react";
import { TouchableOpacity, View, Image, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or 'react-native-vector-icons/Ionicons'

function FilePreviewVideo({ onPress, item, isCurrentUser, publicUrl, videoThumbnail, thumbnailLoading }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        marginTop: 4,
        marginBottom: item.content ? 12 : 0,
        alignSelf: isCurrentUser ? "flex-end" : "flex-start",
        marginHorizontal: 0,
      }}
    >
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#222",
          marginHorizontal: 2,
          width: 190,
          height: 250,
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {thumbnailLoading ? (
          <ActivityIndicator size={32} color="#fff" />
        ) : videoThumbnail ? (
          <Image
            source={{ uri: videoThumbnail }}
            style={{
              width: 190,
              height: 250,
              resizeMode: "cover",
              borderRadius: 12,
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        ) : null}

        <Ionicons
          name="play-circle"
          size={64}
          color="#fff"
          style={{ opacity: 0.85, zIndex: 2 }}
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            marginTop: 8,
            zIndex: 2,
          }}
        >
          Tap to play video
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default FilePreviewVideo;