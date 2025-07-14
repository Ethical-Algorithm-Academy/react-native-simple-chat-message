import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";

function BackToLoginButton({ onPress, text = "Back to sign in" }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name="arrow-back-outline" size={RFValue(16)} color="#000" />
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RFValue(8),
    marginTop: RFValue(16),
  },
  buttonText: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    textDecorationLine: "underline",
  },
});

export default BackToLoginButton; 