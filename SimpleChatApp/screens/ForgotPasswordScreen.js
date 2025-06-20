import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { supabase } from '../lib/supabase';
import { useSnackbar } from "../contexts/SnackbarContext";

import { NAV_LOGIN_SCREEN } from "../constants/navigation";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import BackToLoginButton from "../components/BackToLoginButton";

function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      showError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'simplechatapp://reset-password',
      });

      if (error) throw error;

      showSuccess('Password reset instructions have been sent to your email');
      
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <IconHeader iconName="key-outline" />
      
      <ScreenTitle 
        title="Forgot your password?"
        subtitle="Enter your email address and we'll send you a link to reset your password"
      />
      
      <FormLabel>Email Address</FormLabel>
      <TextInput
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <PrimaryButton
        iconName="mail-outline"
        title={loading ? 'Sending...' : 'Send Reset Link'}
        onPress={handleResetPassword}
        loading={loading}
      />
      
      <BackToLoginButton 
        onPress={() => navigation.navigate(NAV_LOGIN_SCREEN)}
      />
    </ScreenContainer>
  );
}

export default ForgotPasswordScreen;
