import { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { supabase } from '../lib/supabase';
import { useSnackbar } from "../contexts/SnackbarContext";

import { NAV_LOGIN_SCREEN } from "../constants/navigation";
import PasswordInput from "../components/PasswordInput";
import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import PrimaryButton from "../components/PrimaryButton";
import BackToLoginButton from "../components/BackToLoginButton";
import LoadingScreen from "../components/LoadingScreen";

function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        showError('Invalid or expired reset link. Please request a new password reset.');
        // Don't navigate manually - let auth state handle it
      }
      // Log the session object for debugging
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[ResetPasswordScreen] session:', session);
    };

    getUser();
  }, []);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showSuccess('Password updated successfully! You can now sign in with your new password.');
      
      // Simply sign out - this will trigger auth state change and show login screen
      await supabase.auth.signOut();      
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      // Simply sign out - this will trigger auth state change and show login screen
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContainer>
          <IconHeader iconName="lock-open-outline" />
          
          <ScreenTitle 
            title="Reset your password"
            subtitle="Enter your new password below"
          />
          
          <FormLabel>New Password</FormLabel>
          <PasswordInput
            ref={passwordInputRef}
            showPassword={showPassword}
            onPress={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
            placeholder="Enter your new password"
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          <FormLabel>Confirm New Password</FormLabel>
          <PasswordInput
            ref={confirmPasswordInputRef}
            showPassword={showConfirmPassword}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />
          
          <PrimaryButton
            iconName="checkmark-outline"
            title={loading ? 'Updating...' : 'Update Password'}
            onPress={handleResetPassword}
            loading={loading}
          />
          
          <BackToLoginButton onPress={handleBackToLogin} />
        </ScreenContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default ResetPasswordScreen; 