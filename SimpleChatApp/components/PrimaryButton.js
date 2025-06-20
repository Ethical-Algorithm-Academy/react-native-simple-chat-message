import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";

function PrimaryButton({ 
  iconName, 
  title, 
  onPress, 
  isLoading = false, 
  isDisabled = false,
  iconColor = "#fff",
  iconSize = 24,
  style = {}
}) {
  return (
    <Pressable
      style={[
        styles.button, 
        (isLoading || isDisabled) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={isLoading || isDisabled}
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
    backgroundColor: "#000",
    padding: RFValue(8),
    borderRadius: RFValue(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFValue(16),
    
  },
  buttonText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default PrimaryButton; 