import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createThumbnail } from 'react-native-create-thumbnail';
import FilePreviewImage from "./FilePreviewImage";
import FilePreviewVideo from "./FilePreviewVideo";
import { formatFileSize } from '../utils/formatFileSize';

const ChatMessageBubble = React.memo(function ChatMessageBubble({ item, isCurrentUser, channelType, onImagePress, onVideoPress, styles }) {
  let senderName = '';
  if (channelType === 'group' && !isCurrentUser) {
    senderName = item.users && item.users.name ? item.users.name.split(' ')[0] : '';
  }
  // Format time and date
  console.log('item.sent_at:', item.sent_at, 'type:', typeof item.sent_at);
  const sentAt = item.sent_at ? new Date(item.sent_at + 'Z') : null;
  console.log('sentAt Date object:', sentAt, 'isValid:', sentAt instanceof Date && !isNaN(sentAt));
  const localTime = sentAt ? sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  console.log('localTime:', localTime);
  console.log('User time zone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  let timeDisplay = localTime;
  // Get file preview URL if present
  let filePreview = null;
  let hasImage = false;
  let hasVideo = false;
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (item.file_url && item.file_type && item.file_type.startsWith('video/')) {
      if (!videoThumbnail && item.publicUrl) {
        setThumbnailLoading(true);
        createThumbnail({ url: item.publicUrl })
          .then(response => {
            if (isMounted) setVideoThumbnail(response.path);
          })
          .catch(() => {
            if (isMounted) setVideoThumbnail(null);
          })
          .finally(() => {
            if (isMounted) setThumbnailLoading(false);
          });
      }
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.file_url, item.file_type, item.publicUrl]);

  if (item.file_url && item.file_type) {
    const publicUrl = item.publicUrl || null;
    if (item.file_type.startsWith('image/')) {
      hasImage = true;
      filePreview = (
        <FilePreviewImage
        onPress={() => onImagePress(publicUrl)}
        item={item}
        isCurrentUser={isCurrentUser}
        publicUrl={publicUrl}
        />
      );
    } else if (item.file_type.startsWith('video/')) {
      hasVideo = true;
      filePreview = (
        <FilePreviewVideo
          onPress={() => onVideoPress(publicUrl)}
          item={item}
          isCurrentUser={isCurrentUser}
          publicUrl={publicUrl}
          videoThumbnail={videoThumbnail}
          thumbnailLoading={thumbnailLoading}
        />
      );
    } else {
      // Format file size
      let sizeStr = '';
      if (item.file_size !== undefined && item.file_size !== null) {
        sizeStr = formatFileSize(item.file_size);
      }
      // Get file extension from file_name if possible
      let ext = '';
      if (item.file_name && item.file_name.includes('.')) {
        ext = item.file_name.split('.').pop().toUpperCase();
      } else if (item.file_type && item.file_type.includes('/')) {
        ext = item.file_type.split('/').pop().toUpperCase();
      }
      filePreview = (
        <View style={{
          marginTop: 8,
          marginBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isCurrentUser ? '#b3d4fc' : '#d1d1d6',
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
          minWidth: 180,
          maxWidth: 320
        }}>
          <Ionicons name="document-outline" size={22} color={isCurrentUser ? "#007AFF" : "#888"} style={{ marginRight: 8 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#222', fontSize: 14, fontWeight: 'bold' }} numberOfLines={1} ellipsizeMode="middle">{item.file_name || 'File'}</Text>
            {(sizeStr || ext) && (
              <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {sizeStr}{(sizeStr && ext) ? ' · ' : ''}{ext}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => {
              if (publicUrl) {
                Linking.openURL(publicUrl);
              }
            }}
            style={{ marginLeft: 10, padding: 4 }}
          >
            <Ionicons name="download-outline" size={22} color={isCurrentUser ? "#007AFF" : "#888"} />
          </Pressable>
        </View>
      );
    }
  }
  return (
    <View
      style={[
        styles.messageBubble,
        isCurrentUser ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {/* Image or video preview on top, only if present */}
      {(hasImage || hasVideo) && filePreview}
      {/* Text content, only if present */}
      {item.content ? (
        <Text style={styles.messageText}>
          {channelType === 'group' && senderName ? <Text style={styles.senderName}>{senderName}: </Text> : null}
          {item.content}
        </Text>
      ) : null}
      {/* File preview for non-images/non-videos */}
      {!hasImage && !hasVideo && filePreview}
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
});

export default ChatMessageBubble; 