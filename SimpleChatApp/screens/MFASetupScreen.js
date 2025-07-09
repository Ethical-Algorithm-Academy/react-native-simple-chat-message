import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RFValue } from "react-native-responsive-fontsize";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";
import Clipboard from "@react-native-clipboard/clipboard";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import BackToLoginButton from "../components/BackToLoginButton";
import LoadingScreen from "../components/LoadingScreen";

import { NAV_MAIN_APP } from "../constants/navigation";

function MFASetupScreen() {
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [existingFactor, setExistingFactor] = useState(null);
  const [currentFactorId, setCurrentFactorId] = useState(null);
  const [copied, setCopied] = useState(false);

  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    checkOrSetupFactor();
    // Clean up secret on unmount
    return () => setSecret("");
  }, []);

  const checkOrSetupFactor = async () => {
    setSetupLoading(true);
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        showSnackbar("Failed to check existing MFA setup", "error");
        setSetupLoading(false);
        return;
      }

      // Look for unverified TOTP factors
      const unverifiedTOTPList = factors.totp?.filter(factor => factor.status === "unverified") || [];
      if (unverifiedTOTPList.length > 0) {
        // Unenroll the last unverified factor
        const lastUnverified = unverifiedTOTPList[unverifiedTOTPList.length - 1];
        await supabase.auth.mfa.unenroll({ factorId: lastUnverified.id });
      }
      // Now enroll a new factor
      await enrollNewFactor();
    } catch (error) {
      showSnackbar("Failed to check MFA status", "error");
    } finally {
      setSetupLoading(false);
    }
  };

  const enrollNewFactor = async () => {
    setSetupLoading(true);
    try {
      const timestamp = Date.now();
      const friendlyName = `SimpleChat App ${timestamp}`;
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });
      if (error) {
        showSnackbar("Failed to setup MFA: " + error.message, "error");
        return;
      }
      // Store the secret and factor ID
      if (data.secret) {
        setSecret(data.secret);
        setCurrentFactorId(data.id);
      } else if (data.totp?.secret) {
        setSecret(data.totp.secret);
        setCurrentFactorId(data.totp.id);
      } else {
        showSnackbar("Failed to get MFA secret", "error");
      }
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode.trim()) {
      showSnackbar("Please enter the verification code", "warning");
      return;
    }

    try {
      setLoading(true);

      let factorId = currentFactorId;

      // If we don't have a factor ID, try to get it
      if (!factorId) {
        if (existingFactor) {
          factorId = existingFactor.id;
        } else {
          // Get the current session to get the factor ID
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            showSnackbar("No active session found", "error");
            return;
          }

          // Get the factors for the current user
          const { data: factors, error: factorsError } =
            await supabase.auth.mfa.listFactors();

          if (factorsError) {
            console.error("Error getting factors:", factorsError);
            showSnackbar("Failed to get MFA factors", "error");
            return;
          }

          // Look for TOTP factors in the 'all' array since 'totp' might be empty
          const totpFactors =
            factors.all?.filter((factor) => factor.factor_type === "totp") ||
            [];

          if (totpFactors.length === 0) {
            showSnackbar("No TOTP factor found", "error");
            return;
          }

          // Use the most recent unverified TOTP factor
          const unverifiedTOTP = totpFactors
            .filter((factor) => factor.status === "unverified")
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

          if (!unverifiedTOTP) {
            showSnackbar("No unverified TOTP factor found", "error");
            return;
          }

          factorId = unverifiedTOTP.id;
        }
      }

      // First, create a challenge for the factor
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: factorId,
        });

      if (challengeError) {
        console.error("Challenge error:", challengeError);
        showSnackbar(
          "Failed to create challenge: " + challengeError.message,
          "error"
        );
        return;
      }

      // Now verify the factor with the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (error) {
        console.error("MFA verification error:", error);
        showSnackbar("Invalid verification code: " + error.message, "error");
        return;
      }

      showSnackbar("MFA setup completed successfully!", "success");
      navigation.navigate(NAV_MAIN_APP);
    } catch (error) {
      console.error("MFA verification error:", error);
      showSnackbar("Failed to verify MFA: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigation.navigate(NAV_MAIN_APP);
  };

  const copyToClipboard = async () => {
    try {
      Clipboard.setString(secret);
      setCopied(true);
      showSnackbar("Code copied to clipboard!", "success");

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      showSnackbar("Failed to copy code", "error");
    }
  };

  if (setupLoading) {
    return <LoadingScreen text="Setting up MFA..." />;
  }

  return (
    <ScreenContainer>
      <IconHeader iconName="shield-checkmark" />
      <ScreenTitle title="Set Up Two-Factor Authentication" />
      {secret ? (
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>
            Step 1: Add to Authenticator App
          </Text>
          <Text style={styles.setupDescription}>
            Open your authenticator app (Google Authenticator, Authy, etc.) and
            add a new account using the code below:
          </Text>
          <Pressable
            style={[styles.secretText, copied && styles.secretTextCopied]}
            onPress={copyToClipboard}
          >
            <Text style={styles.secretTextContent}>{secret}</Text>
            <Text style={styles.copyHint}>
              {copied ? "Copied!" : "Tap to copy"}
            </Text>
          </Pressable>
          <Text style={styles.setupNote}>
            After adding the code to your app, you'll see a 6-digit code. Enter
            it below to complete setup.
          </Text>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to generate MFA setup</Text>
          <PrimaryButton
            title="Retry Setup"
            onPress={checkOrSetupFactor}
            style={styles.retryButton}
            iconName="refresh-outline"
          />
        </View>
      )}

      <FormLabel>Verification Code</FormLabel>
      <TextInput
        placeholder="Enter 6-digit code from your app"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="numeric"
        maxLength={6}
      />

      <PrimaryButton
        title="Verify and Complete Setup"
        onPress={verifyMFA}
        isLoading={loading}
        isDisabled={!verificationCode.trim() || setupLoading}
        iconName="checkmark-done-outline"
      />

      <BackToLoginButton onPress={handleBackToMain} text="Back to Main App" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: RFValue(14),
    color: "rgb(43, 43, 43)",
    textAlign: "center",
    marginBottom: RFValue(24),
    lineHeight: RFValue(20),
  },
  setupContainer: {
    backgroundColor: "rgb(248, 248, 248)",
    borderRadius: RFValue(12),
    padding: RFValue(20),
    marginBottom: RFValue(24),
  },
  setupTitle: {
    fontSize: RFValue(16),
    fontWeight: "600",
    color: "rgb(0, 0, 0)",
    marginBottom: RFValue(8),
  },
  setupDescription: {
    fontSize: RFValue(14),
    color: "rgb(43, 43, 43)",
    lineHeight: RFValue(20),
    marginBottom: RFValue(16),
  },
  setupNote: {
    fontSize: RFValue(12),
    color: "rgb(107, 114, 128)",
    fontStyle: "italic",
    marginTop: RFValue(12),
    lineHeight: RFValue(16),
  },
  secretContainer: {
    alignItems: "center",
    marginVertical: RFValue(16),
  },
  secretLabel: {
    fontSize: RFValue(12),
    color: "rgb(43, 43, 43)",
    marginBottom: RFValue(8),
  },
  secretText: {
    backgroundColor: "rgb(255, 255, 255)",
    padding: RFValue(12),
    borderRadius: RFValue(8),
    borderWidth: 1,
    borderColor: "rgb(200, 200, 200)",
    alignItems: "center",
    minWidth: RFValue(200),
  },
  secretTextCopied: {
    backgroundColor: "rgb(220, 252, 231)",
    borderColor: "rgb(34, 197, 94)",
  },
  secretTextContent: {
    fontSize: RFValue(16),
    fontFamily: "monospace",
    color: "rgb(0, 0, 0)",
    letterSpacing: 1,
    textAlign: "center",
  },
  copyHint: {
    fontSize: RFValue(10),
    color: "rgb(107, 114, 128)",
    marginTop: RFValue(4),
    fontStyle: "italic",
  },
  existingContainer: {
    alignItems: "center",
    marginBottom: RFValue(24),
    padding: RFValue(20),
    backgroundColor: "rgb(254, 243, 199)",
    borderRadius: RFValue(12),
    borderWidth: 1,
    borderColor: "rgb(251, 191, 36)",
  },
  existingText: {
    fontSize: RFValue(14),
    color: "rgb(120, 53, 15)",
    textAlign: "center",
    marginBottom: RFValue(16),
    lineHeight: RFValue(20),
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: RFValue(24),
    padding: RFValue(40),
  },
  loadingText: {
    fontSize: RFValue(16),
    color: "rgb(43, 43, 43)",
  },
  errorContainer: {
    alignItems: "center",
    marginBottom: RFValue(24),
    padding: RFValue(40),
  },
  errorText: {
    fontSize: RFValue(16),
    color: "rgb(220, 38, 38)",
    marginBottom: RFValue(16),
  },
  retryButton: {
    marginTop: RFValue(8),
  },
});

export default MFASetupScreen;
