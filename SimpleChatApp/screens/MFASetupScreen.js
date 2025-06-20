import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RFValue } from "react-native-responsive-fontsize";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";
import Clipboard from '@react-native-clipboard/clipboard';

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import BackToLoginButton from "../components/BackToLoginButton";

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
    checkExistingFactors();
  }, []);

  const checkExistingFactors = async () => {
    try {
      setSetupLoading(true);
      
      // Check for existing factors
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking factors:', error);
        showSnackbar('Failed to check existing MFA setup', 'error');
        return;
      }

      console.log('Existing factors:', factors);

      // Look for verified TOTP factors first
      const verifiedTOTP = factors.totp?.find(factor => factor.status === 'verified');
      if (verifiedTOTP) {
        showSnackbar('MFA is already enabled for this account', 'info');
        navigation.navigate(NAV_MAIN_APP);
        return;
      }

      // Look for unverified TOTP factors
      const unverifiedTOTP = factors.totp?.find(factor => factor.status === 'unverified');
      
      if (unverifiedTOTP) {
        // Use existing factor
        setExistingFactor(unverifiedTOTP);
        setCurrentFactorId(unverifiedTOTP.id);
        showSnackbar('Found existing MFA setup. Please complete verification.', 'info');
      } else {
        // No existing factors, create new one
        setupMFA();
      }
    } catch (error) {
      console.error('Error checking existing factors:', error);
      showSnackbar('Failed to check MFA status', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  const cleanupExistingFactors = async () => {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error getting factors for cleanup:', error);
        return false;
      }

      console.log('Factors to cleanup:', factors);

      // Remove all existing TOTP factors
      const totpFactors = factors.totp || [];
      
      for (const factor of totpFactors) {
        try {
          console.log('Removing factor:', factor.id, factor.friendly_name);
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
          console.log('Successfully removed factor:', factor.id);
        } catch (unenrollError) {
          console.error('Error removing factor:', factor.id, unenrollError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error in cleanup:', error);
      return false;
    }
  };

  const setupMFA = async () => {
    try {
      setSetupLoading(true);
      
      // Clean up all existing factors first
      const cleanupSuccess = await cleanupExistingFactors();
      
      if (!cleanupSuccess) {
        showSnackbar('Failed to clean up existing factors', 'error');
        return;
      }

      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now create new factor with a unique name
      const timestamp = Date.now();
      const friendlyName = `SimpleChat App ${timestamp}`;
      
      console.log('Creating new factor with name:', friendlyName);
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName
      });

      if (error) {
        console.error('MFA setup error:', error);
        showSnackbar('Failed to setup MFA: ' + error.message, 'error');
        return;
      }

      console.log('MFA setup response:', data);
      
      // Extract the secret and factor ID from the response
      if (data.secret) {
        setSecret(data.secret);
        // Store the factor ID for verification
        if (data.id) {
          setCurrentFactorId(data.id);
        }
      } else if (data.totp?.secret) {
        setSecret(data.totp.secret);
        if (data.totp.id) {
          setCurrentFactorId(data.totp.id);
        }
      } else {
        console.error('No secret found in response');
        console.log('Available data fields:', Object.keys(data));
        showSnackbar('Failed to get MFA secret', 'error');
      }
    } catch (error) {
      console.error('MFA setup error:', error);
      showSnackbar('Failed to setup MFA', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode.trim()) {
      showSnackbar('Please enter the verification code', 'warning');
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
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            showSnackbar('No active session found', 'error');
            return;
          }

          // Get the factors for the current user
          const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
          
          if (factorsError) {
            console.error('Error getting factors:', factorsError);
            showSnackbar('Failed to get MFA factors', 'error');
            return;
          }

          console.log('Available factors for verification:', factors);

          // Look for TOTP factors in the 'all' array since 'totp' might be empty
          const totpFactors = factors.all?.filter(factor => factor.factor_type === 'totp') || [];
          console.log('TOTP factors found:', totpFactors);
          
          if (totpFactors.length === 0) {
            showSnackbar('No TOTP factor found', 'error');
            return;
          }
          
          // Use the most recent unverified TOTP factor
          const unverifiedTOTP = totpFactors
            .filter(factor => factor.status === 'unverified')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          
          if (!unverifiedTOTP) {
            showSnackbar('No unverified TOTP factor found', 'error');
            return;
          }
          
          factorId = unverifiedTOTP.id;
          console.log('Selected factor for verification:', unverifiedTOTP);
        }
      }

      console.log('Using factor ID for verification:', factorId);
      console.log('Verification code:', verificationCode);

      // First, create a challenge for the factor
      console.log('Creating challenge for factor:', factorId);
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) {
        console.error('Challenge error:', challengeError);
        showSnackbar('Failed to create challenge: ' + challengeError.message, 'error');
        return;
      }

      console.log('Challenge created:', challengeData);

      // Now verify the factor with the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (error) {
        console.error('MFA verification error:', error);
        showSnackbar('Invalid verification code: ' + error.message, 'error');
        return;
      }

      console.log('MFA verification successful:', data);
      showSnackbar('MFA setup completed successfully!', 'success');
      navigation.navigate(NAV_MAIN_APP);
    } catch (error) {
      console.error('MFA verification error:', error);
      showSnackbar('Failed to verify MFA: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigation.navigate(NAV_MAIN_APP);
  };

  const retrySetup = async () => {
    setExistingFactor(null);
    setSecret("");
    setVerificationCode("");
    setCopied(false);
    setCurrentFactorId(null);
    
    // Clean up and start fresh
    await cleanupExistingFactors();
    setupMFA();
  };

  const copyToClipboard = async () => {
    try {
      Clipboard.setString(secret);
      setCopied(true);
      showSnackbar('Code copied to clipboard!', 'success');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showSnackbar('Failed to copy code', 'error');
    }
  };

  return (
    <ScreenContainer>
      <IconHeader iconName="shield-checkmark" />
      <ScreenTitle title="Set Up Two-Factor Authentication" />
      
      <Text style={styles.description}>
        Add an extra layer of security to your account by setting up two-factor authentication.
      </Text>

      {setupLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up MFA...</Text>
        </View>
      ) : secret ? (
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Step 1: Add to Authenticator App</Text>
          <Text style={styles.setupDescription}>
            Open your authenticator app (Google Authenticator, Authy, etc.) and add a new account using the code below:
          </Text>
          
          <View style={styles.secretContainer}>
            <Text style={styles.secretLabel}>Manual entry code:</Text>
            <Pressable
              style={[styles.secretText, copied && styles.secretTextCopied]}
              onPress={copyToClipboard}
            >
              <Text style={styles.secretTextContent}>{secret}</Text>
              <Text style={styles.copyHint}>
                {copied ? 'Copied!' : 'Tap to copy'}
              </Text>
            </Pressable>
          </View>
          
          <Text style={styles.setupNote}>
            After adding the code to your app, you'll see a 6-digit code. Enter it below to complete setup.
          </Text>
        </View>
      ) : existingFactor ? (
        <View style={styles.existingContainer}>
          <Text style={styles.existingText}>
            You have an existing MFA setup that needs to be completed. Please enter the verification code from your authenticator app.
          </Text>
          <PrimaryButton
            title="Start New Setup"
            onPress={retrySetup}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to generate MFA setup</Text>
          <PrimaryButton
            title="Retry Setup"
            onPress={retrySetup}
            style={styles.retryButton}
          />
        </View>
      )}

      <FormLabel label="Verification Code" />
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
        loading={loading}
        disabled={!verificationCode.trim() || setupLoading}
      />

      <BackToLoginButton onPress={handleBackToMain} title="Back to Main App" />
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