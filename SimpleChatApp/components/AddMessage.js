import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
1
const AddMensage = ({ onPress, icon = "add" }) => (
  <Pressable
    style={({ pressed }) => [
      styles.fab,
      pressed && styles.pressed,
    ]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={RFValue(32)} color="#fff" />
  </Pressable>
);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: RFValue(8),
    bottom: RFValue(24),
    width: RFValue(56),
    height: RFValue(56),
    borderRadius: RFValue(28),
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default AddMensage;