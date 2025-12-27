import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import PrimaryButton from "../components/PrimaryButton";
import TextInput from "../components/TextInput";

import { NAV_MAIN_APP } from "../constants/navigation";

export default function MFAVerificationScreen({ challengeId, factorId }) {
  console.log("[MFA] MFAVerificationScreen rendered with props:", {
    challengeId,
    factorId,
  });
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation();

  const handleVerify = async () => {
    setLoading(true);
    try {
      // Use challengeId and factorId to verify MFA
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) {
        console.log("[MFA] Verification error:", error);
        showSnackbar("Invalid code. Please try again.", "error");
      } else {
        console.log("[MFA] Verification successful:");
        showSnackbar("MFA verified!", "success");
        console.log('[MFA] Setting mfa_verified in AsyncStorage...');
        await AsyncStorage.setItem("mfa_verified", "true");
        console.log('[MFA] mfa_verified set. Clearing pendingMfa...');

        navigation.reset({ index: 0, routes: [{ name: NAV_MAIN_APP }] });
        console.log('[MFA] navigation.reset to main app called.');
      }
    } catch (err) {
      showSnackbar("An error occurred during verification.", "error");
      console.log('[MFA] Exception during verification:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <IconHeader iconName="shield-checkmark-outline" />
      
      <ScreenTitle 
        title="Two-Factor Authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
      />
      
      <FormLabel>Verification Code</FormLabel>
      <TextInput
        placeholder="Enter 6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
        editable={!loading}
        returnKeyType="done"
        onSubmitEditing={handleVerify}
      />
      
      <PrimaryButton
        iconName="checkmark-outline"
        title={loading ? "Verifying..." : "Verify"}
        onPress={handleVerify}
        loading={loading}
      />
    </ScreenContainer>
  );
}

