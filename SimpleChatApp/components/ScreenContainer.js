import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";

function ScreenContainer({ children, style = {} }) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
  },
  container: {
    flex: 1,
    marginHorizontal: RFValue(16),
    marginTop: RFValue(20),
  },
});

export default ScreenContainer; 