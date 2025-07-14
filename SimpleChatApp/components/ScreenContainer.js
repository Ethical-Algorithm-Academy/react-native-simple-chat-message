import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";

function ScreenContainer({ children, style = {} }) {
  return (
    <SafeAreaView style={[styles.safeArea, { marginHorizontal: RFValue(16), marginTop: RFValue(20) }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
  },
});

export default ScreenContainer; 