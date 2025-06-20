import { View, Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function Divider({ text }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(16),
    marginHorizontal: RFValue(8),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#d9d9d9",
  },
  text: {
    marginHorizontal: RFValue(8),
    fontSize: RFValue(12),
    color: "#666",
    fontWeight: "bold",
  },
});

export default Divider;
