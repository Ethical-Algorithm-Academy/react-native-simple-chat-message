import { TextInput as RNTextInput, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function TextInput({ 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  ...props 
}) {
  return (
    <RNTextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgb(43, 43, 43)"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: RFValue(8),
    padding: RFValue(12),
    marginBottom: RFValue(12),
  },
});

export default TextInput; 