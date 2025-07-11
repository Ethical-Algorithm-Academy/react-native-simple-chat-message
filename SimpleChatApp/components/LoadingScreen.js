import { View, Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function LoadingScreen({ text = "Loading..." }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: RFValue(16),
    color: "#666",
  },
});

export default LoadingScreen; 