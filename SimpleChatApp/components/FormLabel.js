import { Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function FormLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: RFValue(16),
    marginBottom: RFValue(4),
    fontWeight: "bold",
    textAlign: "left",
  },
});

export default FormLabel; 