import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";

function SecondaryButton({ 
  iconName, 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  iconColor = "#000",
  iconSize = 24,
  style = {}
}) {
  return (
    <Pressable
      style={[
        styles.button, 
        (loading || disabled) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Ionicons 
        name={iconName} 
        size={RFValue(iconSize)} 
        color={iconColor} 
      />
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: RFValue(8),
    borderRadius: RFValue(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFValue(16),
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: RFValue(14),
    color: "#000",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default SecondaryButton; 