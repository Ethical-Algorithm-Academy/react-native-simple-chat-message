import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

function PasswordInput({
  showPassword,
  onPress,
  secureTextEntry,
  placeholder,
  value,
  onChangeText,
}) {
  return (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor="rgb(43, 43, 43)"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      <Pressable
        style={styles.eyeIcon}
        onPress={onPress}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons
          name={showPassword ? "eye-off-outline" : "eye-outline"}
          size={RFValue(20)}
          color="#333"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: RFValue(8),
    marginBottom: RFValue(12),
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: RFValue(12),
    color: "#000",
    paddingRight: RFValue(8),
  },
  eyeIcon: {
    padding: RFValue(8),
    marginRight: RFValue(4),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PasswordInput;
