import { View, Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const Divider = ({ fullcontainer, text }) => {
  return fullcontainer ? (
    <View style={styles.fullcontainer}>
      <View style={styles.line} />
      {text && <Text style={styles.text}>{text}</Text>}
      <View style={styles.line} />
    </View>
  ) : (
    <View style={styles.container}>
      <View style={styles.line} />
      {text && <Text style={styles.text}>{text}</Text>}
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(16),
    marginHorizontal: RFValue(8),
  },
  fullcontainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(8),
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
