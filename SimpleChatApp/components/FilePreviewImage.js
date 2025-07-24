import { TouchableOpacity, View, Image } from "react-native";
function FilePreviewImage({ onPress, item ,isCurrentUser, publicUrl}) {
  return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={{ marginTop: 4, marginBottom: item.content ? 12 : 0, alignSelf: isCurrentUser ? 'flex-end' : 'flex-start', marginHorizontal: 0 }}
        >
          <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#eee', marginHorizontal: 2 }}>
            <Image
              source={{ uri: publicUrl }}
              style={{ width: 190, height: 250, resizeMode: 'cover', borderRadius: 12 }}
            />
          </View>
        </TouchableOpacity>
  );
}

export default FilePreviewImage; 