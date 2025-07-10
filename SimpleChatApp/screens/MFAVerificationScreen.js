import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import PrimaryButton from "../components/PrimaryButton";
import TextInput from "../components/TextInput";

export default function MFAVerificationScreen({ challengeId, factorId, onVerified }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

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
        showSnackbar("Invalid code. Please try again.", "error");
      } else {
        showSnackbar("MFA verified!", "success");
        if (onVerified) {
          if (data?.session) {
            onVerified(data.session);
          } else {
            const { data: sessionData } = await supabase.auth.getSession();
            onVerified(sessionData.session);
          }
        }
      }
    } catch (err) {
      showSnackbar("An error occurred during verification.", "error");
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

