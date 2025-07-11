import {
    View,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Pressable,
  } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import TextInput from "./TextInput";
import { RFValue } from "react-native-responsive-fontsize";


function SearchBar({placeholder,value,onChangeText}) {
  return (
    <View style={styles.searchbar}>
      <Ionicons
        name="search"
        size={24}
        color="#888"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    searchbar: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d9d9d9",
        borderRadius: RFValue(8),
      },
      searchInput: {
        padding: RFValue(12),
        minHeight: RFValue(44),
        flex: 1,
      },
      searchIcon: {
        alignSelf: "center",
        marginLeft: RFValue(8),
        marginRight: RFValue(4),
      },
})

export default SearchBar;