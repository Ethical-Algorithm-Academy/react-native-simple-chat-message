import React from "react";
import { View, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import PrimaryButton from "../components/PrimaryButton";
import ScreenContainer from "../components/ScreenContainer";
import ScreenTitle from "../components/ScreenTitle";
import { useNavigation } from "@react-navigation/native";
import { NAV_MFA_SETUP_SCREEN } from "../constants/navigation";
import { RFValue } from "react-native-responsive-fontsize";

const ConfigurationsScreen = () => {
  const navigation = useNavigation();
  const [isMfaEnabled, setIsMfaEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkMfa = async () => {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.some(factor => factor.status === "verified")) {
        setIsMfaEnabled(true);
      } else {
        setIsMfaEnabled(false);
      }
    };
    checkMfa();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMFASetup = () => {
    navigation.navigate(NAV_MFA_SETUP_SCREEN);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Configurations</ScreenTitle>
      <View style={styles.buttonContainer}>
        {/* Button Disabled if MFA Setup is already set */}
        <PrimaryButton
          onPress={handleMFASetup}
          style={styles.button}
          iconName="key-outline"
          title="MFA Setup"
          isDisabled={isMfaEnabled}
        />
        <PrimaryButton
          onPress={handleLogout}
          style={styles.button}
          iconName="log-out-outline"
          title="Logout"
        />
        {/* Not implemented Yet */}
        <PrimaryButton
          style={styles.button}
          iconName="sunny-outline"
          title="Mode: Light"
          isDisabled={true}
        />
        {/* Not implemented Yet */}
        <PrimaryButton
          style={styles.button}
          iconName="language-outline"
          title="Language: EN"
          isDisabled={true}
        />
        <PrimaryButton
          onPress={handleBack}
          style={styles.button}
          iconName="arrow-back-outline"
          title="Back to Channels"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: RFValue(16),
    gap: RFValue(32),
    justifyContent: "center",
    marginBottom: RFValue(32),
  },
  button: {
    marginVertical: RFValue(8),
  },
});

export default ConfigurationsScreen;