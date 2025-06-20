import { Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function ScreenTitle({ title, subtitle }) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: RFValue(24),
    fontWeight: "bold",
    marginBottom: RFValue(6),
    textAlign: "center",
  },
  subtitle: {
    fontSize: RFValue(14),
    marginBottom: RFValue(20),
    textAlign: "center",
    color: "#666",
  },
});

export default ScreenTitle; 