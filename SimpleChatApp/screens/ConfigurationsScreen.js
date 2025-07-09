import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { supabase } from "../lib/supabase";
import PrimaryButton from "../components/PrimaryButton";
import ScreenContainer from "../components/ScreenContainer";
import ScreenTitle from "../components/ScreenTitle";
import { useNavigation } from "@react-navigation/native";
import { NAV_MFA_SETUP_SCREEN } from "../constants/navigation";
import { RFValue } from "react-native-responsive-fontsize";
import { getFcmTokenForUser } from "./MainApp";

const ConfigurationsScreen = () => {
  const navigation = useNavigation();
  const [isMfaEnabled, setIsMfaEnabled] = React.useState(false);
  const [mfaFactorId, setMfaFactorId] = React.useState(null); // Store factor id
  const [loading, setLoading] = React.useState(false);
  const { showSuccess, showError } = require('../contexts/SnackbarContext').useSnackbar();

  React.useEffect(() => {
    const checkMfa = async () => {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.some(factor => factor.status === "verified")) {
        setIsMfaEnabled(true);
        // Store the first verified factor id
        const verifiedFactor = factors.totp.find(factor => factor.status === "verified");
        setMfaFactorId(verifiedFactor?.id || null);
      } else {
        setIsMfaEnabled(false);
        setMfaFactorId(null);
      }
    };
    checkMfa();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Get current user ID
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        // Remove FCM token from Supabase for this user
        const token = await getFcmTokenForUser(user.id);
        if (token) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('fcm_tokens')
            .eq('id', user.id)
            .single();
          if (!error && userData) {
            const tokens = (userData.fcm_tokens || []).filter(t => t !== token);
            const { error: updateError } = await supabase
              .from('users')
              .update({ fcm_tokens: tokens })
              .eq('id', user.id);
          }
        }
      }
      
      const { error } = await supabase.auth.signOut();
      const { data: sessionData } = await supabase.auth.getSession();
      if (error) {
        console.error('[Logout] signOut error:', error);
        showError('Logout failed: ' + error.message);
      } else {
        showSuccess('Logged out successfully!');
        // Navigation reset removed; App.js will handle navigation based on session state
      }
    } catch (e) {
      console.error('[Logout] Error:', e);
      showError('Logout failed: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleMFASetup = () => {
    navigation.navigate(NAV_MFA_SETUP_SCREEN);
  };

  const handleDeactivateMFA = async () => {
    if (!mfaFactorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) {
        showError('Failed to deactivate MFA: ' + error.message);
      } else {
        showSuccess('MFA deactivated successfully!');
        setIsMfaEnabled(false);
        setMfaFactorId(null);
      }
    } catch (e) {
      showError('Failed to deactivate MFA: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Configurations</ScreenTitle>
      <View style={styles.buttonContainer}>
        {/* MFA Setup or Deactivate MFA Button */}
        {isMfaEnabled ? (
          <PrimaryButton
            onPress={handleDeactivateMFA}
            style={styles.button}
            iconName="key-outline"
            title={loading ? "Deactivating MFA..." : "Deactivate MFA"}
            isDisabled={loading}
          />
        ) : (
          <PrimaryButton
            onPress={handleMFASetup}
            style={styles.button}
            iconName="key-outline"
            title="MFA Setup"
            isDisabled={loading}
          />
        )}
        <PrimaryButton
          onPress={handleLogout}
          style={styles.button}
          iconName="log-out-outline"
          title={loading ? "Logging out..." : "Logout"}
          isDisabled={loading}
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