import { View, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";



function IconHeader({ iconName, iconSize = 24, iconColor = "rgb(0, 0, 0)", image }) {

  return (
    <View style={styles.iconContainer}>
      <View style={styles.iconBackground}>
        {image ? (
          <Image
            source={image}
            style={{ width: RFValue(48), height: RFValue(48), borderRadius: RFValue(100) }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={iconName}
            size={RFValue(iconSize)}
            color={iconColor}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    marginBottom: RFValue(12),
  },
  iconBackground: {
    backgroundColor: "rgb(202, 201, 201)",
    borderRadius: RFValue(100),
    width: RFValue(48),
    height: RFValue(48),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default IconHeader; 