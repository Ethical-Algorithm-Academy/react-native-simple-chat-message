import { Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function ScreenTitle({ title, subtitle, textAlign = "center", fontSize = 24, marginBottom=6 }) {
  return (
    <>
      <Text
        style={[
          styles.title,
          { textAlign: textAlign },
          { fontSize: RFValue(fontSize) },
          { marginBottom: RFValue(marginBottom) },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { textAlign: textAlign }]}>
          {subtitle}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: RFValue(24),
    fontWeight: "bold",
    marginBottom: RFValue(4),
  },
  subtitle: {
    fontSize: RFValue(14),
    marginBottom: RFValue(16),
    color: "#666",
  },
});

export default ScreenTitle;
