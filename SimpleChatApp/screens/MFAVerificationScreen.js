import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

function MFAVerificationScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyMFA = async () => {
    if (!verificationCode) {
      showError("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);
      
      // This will be called after the user enters their MFA code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: 'totp', // You'll need to get the actual factorId
        code: verificationCode
      });

      if (error) throw error;

      showSuccess("MFA verification successful!");
      // Navigate to main app or next screen
      navigation.navigate('MainApp');
      
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setLoading(true);
      
      // Resend MFA challenge
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp' // You'll need to get the actual factorId
      });

      if (error) throw error;

      showSuccess("New verification code sent!");
      
    } catch (error) {
      showError(error.message);
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
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
      />
      
      <PrimaryButton
        iconName="checkmark-outline"
        title={loading ? "Verifying..." : "Verify"}
        onPress={verifyMFA}
        loading={loading}
      />
      
      <SecondaryButton
        iconName="refresh-outline"
        title="Resend Code"
        onPress={resendCode}
        loading={loading}
      />
    </ScreenContainer>
  );
}

export default MFAVerificationScreen; 