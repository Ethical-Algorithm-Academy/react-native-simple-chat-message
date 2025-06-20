import { View, Text, Pressable, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

function NavigationLink({ 
  text, 
  linkText, 
  onPress, 
  containerStyle = {} 
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.link}>{linkText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: RFValue(16),
  },
  text: {
    fontWeight: "bold",
    fontSize: RFValue(14),
  },
  link: {
    color: "black",
    fontWeight: "bold",
    textDecorationLine: "underline",
    fontSize: RFValue(14),
  },
});

export default NavigationLink; 